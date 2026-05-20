# Project Context (NestJS BE)

## Stack
- **Runtime**: Node.js, TypeScript
- **Framework**: NestJS + Fastify (NOT Express)
- **ORM**: Drizzle ORM with postgres-js
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis) + Redlock
- **Queue**: BullMQ (@nestjs/bullmq)
- **Storage**: S3-compatible (MinIO local / AWS S3 / Cloudflare R2)
- **Logging**: nestjs-pino (structured JSON logs)
- **Auth**: JWT (access + refresh tokens)
- **IDs**: Snowflake bigint (NOT uuid)

## Commands
```bash
yarn start:dev          # dev server (watch mode, SWC)
yarn build              # nest build
yarn typecheck          # tsc --noEmit
yarn lint               # eslint --fix
yarn test               # jest
yarn test:cov           # jest --coverage
yarn db:generate        # drizzle-kit generate (from schema changes)
yarn db:migrate         # apply pending migrations
yarn db:push            # push schema directly (dev only)
yarn db:studio          # open drizzle studio
```

## Key Files
- `src/app.module.ts` — root module
- `src/main.ts` — bootstrap (Fastify, global pipes/filters/interceptors)
- `src/core/database/schema/app.schema.ts` — ALL table definitions
- `src/core/database/base.repository.ts` — base class for repositories
- `src/common/guards/auth.guard.ts` — JWT auth guard
- `src/common/constants/message-codes.ts` — error codes
- `drizzle.config.ts` — drizzle-kit config
- `.env.example` — all required env vars

## Project Structure
```
src/
├── app.module.ts
├── main.ts
├── config/           ← registerAs() config factories (app, db, redis, jwt, storage)
├── common/           ← shared: guards, pipes, filters, interceptors, utils, exceptions
├── core/             ← infrastructure: database, redis, queue, storage, logger
└── modules/
    ├── auth/         ← login, refresh, change-password
    ├── users/        ← CRUD users
    └── health/       ← health check endpoint
```

## Workflow
1. Define/update schema in `app.schema.ts` → run `yarn db:generate`
2. Create repository extending `BaseRepository`
3. Create service with business logic
4. Create controller (thin — parse input, call service)
5. Wire up in module
6. Run `yarn typecheck` to verify
