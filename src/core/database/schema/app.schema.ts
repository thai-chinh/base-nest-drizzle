import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  bigint,
  integer,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── BASE COLUMNS ─────────────────────────────────────────────────────────────

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

// ─── USERS ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    ...baseColumns,
    ...auditColumns,
    ...softDeleteColumns,

    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    avatarUrl: varchar('avatar_url', { length: 1000 }),

    // Simple role string — extend as needed per domain (e.g. 'admin' | 'user')
    role: varchar('role', { length: 50 }).notNull().default('user'),

    // 1=Active, 2=Inactive, 3=Locked
    status: integer('status').notNull().default(1),

    // JSON string for domain-specific extensibility without schema changes
    metadata: text('metadata'),
  },
  (t) => [
    uniqueIndex('uq_users_email')
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
    index('idx_users_role').on(t.role),
    index('idx_users_status').on(t.status),
    index('idx_users_deleted_at').on(t.deletedAt),
  ],
);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
