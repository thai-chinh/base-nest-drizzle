---
name: drizzle-patterns
description: Drizzle ORM patterns for this NestJS project — schema definition, BaseRepository, dependency injection, transactions, and migration management using postgres-js and Snowflake IDs.
origin: project
---

# Drizzle ORM Patterns

Patterns specific to this project's Drizzle setup.

## When to Activate

- Defining new tables or modifying schema
- Creating a new repository
- Writing queries, joins, or transactions
- Running or generating migrations

## Project Structure

```text
src/
├── core/
│   └── database/
│       ├── database.module.ts      ← Global @Module, provides DATABASE_CONNECTION
│       ├── database.types.ts       ← DrizzleDB, Transaction types
│       ├── database.utils.ts       ← DATABASE_CONNECTION token, factory helpers
│       ├── base.repository.ts      ← Abstract base class for all repositories
│       └── schema/
│           ├── app.schema.ts       ← All table definitions (single public schema)
│           └── index.ts            ← re-exports app.schema
drizzle/                            ← Generated migration files (drizzle-kit output)
drizzle.config.ts                   ← Drizzle Kit config
```

## Schema Definition

All tables live in `src/core/database/schema/app.schema.ts` in the `public` schema.

```ts
import {
  pgTable, bigint, varchar, integer, timestamp, text,
  boolean, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Reusable column groups
const baseColumns = {
  id: bigint('id', { mode: 'bigint' }).primaryKey().notNull(),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

const auditColumns = {
  createdBy: bigint('created_by', { mode: 'bigint' }),
  updatedBy: bigint('updated_by', { mode: 'bigint' }),
  deletedBy: bigint('deleted_by', { mode: 'bigint' }),
};

const softDeleteColumns = {
  deletedAt: timestamp('deleted_at'),
};

export const posts = pgTable(
  'posts',
  {
    ...baseColumns,
    ...auditColumns,
    ...softDeleteColumns,
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    published: boolean('published').notNull().default(false),
    authorId: bigint('author_id', { mode: 'bigint' }).notNull(),
  },
  (t) => [
    index('idx_posts_author').on(t.authorId),
    index('idx_posts_deleted_at').on(t.deletedAt),
    uniqueIndex('uq_posts_title')
      .on(t.title)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

**Rules:**
- Always use `bigint` with `{ mode: 'bigint' }` for IDs — never `uuid` or `serial`
- Always spread `baseColumns`, `auditColumns`, `softDeleteColumns` for consistency
- Soft delete: set `deletedAt`, never hard delete
- Unique indexes on soft-deleted tables use `.where(sql\`${t.deletedAt} IS NULL\`)`
- Export `$inferSelect` and `$inferInsert` types from every table

## BaseRepository

All repositories extend `BaseRepository` from `@/core/database`.

```ts
import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { BaseRepository, DATABASE_CONNECTION } from '@/core/database';
import { DrizzleDB, Transaction } from '@/core/database/database.types';
import * as schema from '@/core/database/schema/app.schema';
import { generateSnowflakeId, now } from '@/common/utils';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PostsRepository extends BaseRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) db: DrizzleDB,
    @InjectPinoLogger(PostsRepository.name)
    private readonly logger: PinoLogger,
  ) {
    super(db);
  }

  async findById(id: bigint, tx?: Transaction) {
    const [post] = await this.getDb(tx)
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.id, id), isNull(schema.posts.deletedAt)))
      .limit(1);
    return post ?? null;
  }

  async create(data: { title: string; authorId: bigint }, tx?: Transaction) {
    const [post] = await this.getDb(tx)
      .insert(schema.posts)
      .values({
        id: generateSnowflakeId(),   // always use Snowflake, never DB-generated
        title: data.title,
        authorId: data.authorId,
      })
      .returning();
    return post;
  }
}
```

**Rules:**
- Always `@Inject(DATABASE_CONNECTION)` as first constructor param, pass to `super(db)`
- Use `this.getDb(tx)` — transparently uses transaction when provided
- Import tables directly from `@/core/database/schema/app.schema` as `schema.*`
- Always pass `tx?: Transaction` to every method for composability
- Use `generateSnowflakeId()` for IDs — never `defaultRandom()` or DB sequences
- Use `now()` from `@/common/utils` for timestamps, not `new Date()`

## Transactions

```ts
// In a service — own the transaction, pass it down to repositories
async transferOwnership(fromId: bigint, toId: bigint, userId: bigint) {
  return this.db.transaction(async (tx) => {
    await this.postsRepository.reassignAuthor(fromId, toId, tx);
    await this.auditRepository.log({ action: 'transfer', userId }, tx);
  });
}
```

**Rules:**
- Services own transactions, repositories receive them
- Never start a transaction inside a repository
- Always pass `tx` down the call chain

## Optimistic Locking

All updates use `version` for conflict detection:

```ts
async update(id: bigint, data: { title: string; version: number; updatedBy: bigint }, tx?: Transaction) {
  const [post] = await this.getDb(tx)
    .update(schema.posts)
    .set({
      title: data.title,
      updatedBy: data.updatedBy,
      updatedAt: now(),
      version: sql`${schema.posts.version} + 1`,
    })
    .where(
      and(
        eq(schema.posts.id, id),
        eq(schema.posts.version, data.version),  // ← optimistic lock
        isNull(schema.posts.deletedAt),
      ),
    )
    .returning();

  return post ?? null; // null means version conflict
}
```

## Soft Delete

```ts
async softDelete(id: bigint, deletedBy: bigint, tx?: Transaction) {
  const [post] = await this.getDb(tx)
    .update(schema.posts)
    .set({ deletedAt: now(), deletedBy })
    .where(and(eq(schema.posts.id, id), isNull(schema.posts.deletedAt)))
    .returning();
  return post ?? null;
}
```

## Pagination

```ts
async findPaginated(params: { page: number; limit: number }, tx?: Transaction) {
  const { page, limit } = params;
  const offset = (page - 1) * limit;
  const db = this.getDb(tx);

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(schema.posts)
      .where(isNull(schema.posts.deletedAt))
      .orderBy(schema.posts.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(schema.posts)
      .where(isNull(schema.posts.deletedAt)),
  ]);

  return { data, total };
}
```

## Migrations

```bash
# Generate migration from schema changes
yarn db:generate

# Apply migrations to DB
yarn db:migrate

# Push schema directly (dev only, no migration file)
yarn db:push

# Open Drizzle Studio
yarn db:studio
```

`drizzle.config.ts` points to `src/core/database/schema/app.schema.ts`, outputs to `./drizzle/`.

**Rules:**
- Never edit generated migration files
- Never use `db:push` in production — always `db:migrate`
- One schema file (`app.schema.ts`) for all tables — no per-domain schema files
