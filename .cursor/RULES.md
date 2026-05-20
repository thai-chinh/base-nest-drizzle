# Project Rules (NestJS BE)

## 🎯 Mandatory Principles
- **Security-First**: Validate all input via DTOs (class-validator). Whitelist + forbidNonWhitelisted always on.
- **Immutability**: Never mutate data; always return new objects.
- **Early returns**: Avoid deep nesting — guard clauses first.
- **Centralized error handling**: Throw typed `ApiException` subclasses, caught by `HttpExceptionFilter`.
- **Environment-aware logging**: Use `EnhancedLogger` from `@/common/utils/logger.util`.

## 🏗 Architecture
- Platform: **NestJS + Fastify** (not Express)
- ORM: **Drizzle** with `postgres-js` client
- IDs: **Snowflake bigint** — never uuid, never DB-generated sequences
- Auth: **JWT** via `AuthGuard` in `src/common/guards/auth.guard.ts`
- Storage: **S3-compatible** (MinIO local, S3/R2 prod) via `StorageService`
- Queue: **BullMQ** via `@nestjs/bullmq`
- Logging: **EnhancedLogger** — use `createLogger()` in every class

## 📁 Folder Structure
```
src/
├── app.module.ts
├── main.ts
├── config/           ← registerAs() config factories
├── common/           ← guards, pipes, filters, interceptors, utils, exceptions
├── core/             ← database, redis, queue, storage, logger (infrastructure)
└── modules/          ← feature modules (auth, users, ...)
    └── [feature]/
        ├── [feature].module.ts
        ├── [feature].service.ts      ← business logic
        ├── [feature].repository.ts   ← data access (extends BaseRepository)
        ├── controllers/
        └── dto/
```

## 💻 Coding Standards

### Database
- Schema: all tables in `src/core/database/schema/app.schema.ts`
- Repositories extend `BaseRepository` from `@/core/database`
- Services own transactions — repositories receive `tx?: Transaction`
- Soft delete only: set `deletedAt`, never hard delete
- Optimistic locking: always check `version` on updates

### API Design
- Controllers are thin: parse input → call service → return DTO
- Response DTOs use `plainToInstance` + `@Transform` for bigint → string
- All endpoints have Swagger decorators (`@ApiTags`, `@ApiOperation`, etc.)
- Run `yarn openapi:generate` after adding new endpoints

### Logging (CRITICAL)
```typescript
// ALWAYS use EnhancedLogger, NOT console.log or @InjectPinoLogger
import { createLogger } from '@/common/utils/logger.util';

export class MyService {
  private readonly logger = createLogger(MyService.name);
  
  async myMethod() {
    // Development: logs everything
    // Production: logs only important info
    this.logger.debug('Debug - dev only', { data: 'test' });
    this.logger.info('Info - both env', { userId: 123 });
    this.logger.error('Error occurred', error, { context: 'operation' });
    
    // Business events (always logged)
    this.logger.business('ORDER_CREATED', { orderId: 456, amount: 100 });
    
    // Performance tracking
    const start = Date.now();
    // ... operation ...
    this.logger.performance('operationName', Date.now() - start, { id: 123 });
  }
}
```

### Security
- Never log sensitive data (auto-redacted: password, token, email, etc.)
- Always validate user input with DTOs + class-validator
- Use parameterized queries (Drizzle handles this)
- Check authorization in services, not just guards

## 🚀 Development Workflow

### 1. Khi bắt đầu tính năng mới:
```bash
# Luôn có trong context:
#File: .cursor/RULES.md
#File: .cursor/CLAUDE.md

# Chọn agent phù hợp:
#File: .cursor/agents/planner.md          # Lập kế hoạch
#File: .cursor/agents/architect.md        # Thiết kế kiến trúc
#File: .cursor/agents/database-reviewer.md # Thiết kế database
```

### 2. Code tính năng:
```typescript
// 1. Tạo schema trong app.schema.ts
// 2. Tạo repository extends BaseRepository
// 3. Tạo service với EnhancedLogger
// 4. Tạo controller với Swagger decorators
// 5. Tạo DTOs với validation
// 6. Viết tests (TDD)
```

### 3. Review & Testing:
```bash
# Review code:
#File: .cursor/agents/code-reviewer.md

# Security review:
#File: .cursor/agents/security-reviewer.md

# Run checks:
yarn typecheck    # TypeScript
yarn lint         # ESLint
yarn test         # Tests
yarn build        # Build
```

## 🛠 Commands
```bash
# Development
yarn start:dev          # dev server
yarn openapi:generate   # generate OpenAPI spec

# Build & Production
yarn build              # production build
yarn start:prod         # production server

# Code Quality
yarn typecheck          # tsc --noEmit
yarn lint               # eslint
yarn test               # jest
yarn test:cov           # jest with coverage

# Database
yarn db:generate        # drizzle-kit generate
yarn db:migrate         # apply migrations
yarn db:push            # push schema (dev only)
yarn db:studio          # drizzle studio
```

## 📊 NODE_ENV Differences

### Development (`NODE_ENV=development`):
- Log level: `debug` (log tất cả)
- Format: Pretty print với màu sắc
- HTTP logs: Tất cả requests/responses
- Stack traces: Đầy đủ
- Swagger UI: Có (`/docs`)
- Performance threshold: 100ms
- DB query threshold: 50ms

### Production (`NODE_ENV=production`):
- Log level: `info` (chỉ log quan trọng)
- Format: JSON (cho log aggregators)
- HTTP logs: Chỉ slow requests (>1s) và errors
- Stack traces: Không (chỉ critical errors)
- Swagger UI: Không
- Performance threshold: 1000ms
- DB query threshold: 500ms

## 🆘 Khi gặp vấn đề

1. **Build errors** → `#File: .cursor/agents/build-error-resolver.md`
2. **Database issues** → `#File: .cursor/agents/database-reviewer.md`
3. **TypeScript errors** → `#File: .cursor/agents/typescript-reviewer.md`
4. **Security concerns** → `#File: .cursor/agents/security-reviewer.md`
5. **Code quality** → `#File: .cursor/agents/code-reviewer.md`
6. **Không biết bắt đầu** → `#File: .cursor/agents/planner.md`

## ✅ Checklist trước khi commit
- [ ] TypeScript compiles (`yarn typecheck`)
- [ ] Lint passes (`yarn lint`)
- [ ] Tests pass (`yarn test`)
- [ ] Build succeeds (`yarn build`)
- [ ] Logging uses `EnhancedLogger`
- [ ] Sensitive data redacted
- [ ] Swagger decorators added
- [ ] OpenAPI spec generated (nếu thêm API mới)
- [ ] Code reviewed (self-review hoặc agent review)
