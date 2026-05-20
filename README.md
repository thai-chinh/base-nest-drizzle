# WedTech Backend

NestJS backend với Fastify, PostgreSQL, Redis, BullMQ, MinIO và Swagger.

## Tech Stack

- **Framework**: NestJS 11 + Fastify
- **Database**: PostgreSQL 17 + Drizzle ORM
- **Cache/Queue**: Redis 7 + BullMQ
- **Storage**: MinIO (S3-compatible)
- **API Documentation**: Swagger UI + OpenAPI 3.0
- **Logger**: Pino (nestjs-pino)
- **Build**: SWC (siêu nhanh)

## Quick Start

### 1. Start Docker Services

```bash
docker compose up -d
```

### 2. Setup Environment

Tạo file `.env` hoặc `.env.local`:

```env
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# CORS
CORS_ORIGIN=*

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=admin_db
DATABASE_URL=postgresql://admin:admin123@localhost:5432/admin_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
```

### 3. Install & Run

```bash
pnpm install
pnpm start:dev
```

### 4. Access API Documentation

Swagger UI: http://localhost:3333/docs

OpenAPI spec: `docs/openapi.json`

## Scripts

```bash
# Development
pnpm start:dev          # Watch mode với SWC

# Production
pnpm build              # Build
pnpm start:prod         # Run production

# Database (Drizzle)
pnpm db:generate        # Generate migrations
pnpm db:migrate         # Run migrations
pnpm db:push            # Push schema to DB
pnpm db:studio          # Open Drizzle Studio

# Testing
pnpm test               # Unit tests
pnpm test:e2e           # E2E tests
pnpm test:cov           # Coverage

# Code Quality
pnpm lint               # ESLint
pnpm format             # Prettier

# API Documentation
pnpm openapi:generate   # Generate OpenAPI spec
```

## Architecture

```
src/
├── config/             # Configuration (app, database, redis)
├── queue/              # BullMQ queues
├── redis/              # Redis client & Redlock
├── app.module.ts       # Root module
└── main.ts             # Bootstrap
```

## Usage Examples

### Redis Client

```typescript
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis';
import Redis from 'ioredis';

@Injectable()
export class MyService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async cacheData(key: string, value: string, ttl = 3600) {
    await this.redis.setex(key, ttl, value);
  }

  async getData(key: string) {
    return await this.redis.get(key);
  }
}
```

### Distributed Lock (Redlock)

```typescript
import { RedlockService } from './redis';

@Injectable()
export class PaymentService {
  constructor(private redlock: RedlockService) {}

  async processPayment(orderId: string) {
    // Đảm bảo chỉ 1 instance xử lý order này
    await this.redlock.withLock(`locks:order:${orderId}`, 10000, async () => {
      // Process payment safely
    });
  }
}
```

### BullMQ Queue

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from './queue';

@Injectable()
export class EmailService {
  constructor(@InjectQueue(QUEUES.EMAIL) private emailQueue: Queue) {}

  async sendWelcomeEmail(userId: string) {
    await this.emailQueue.add(
      'welcome',
      { userId },
      {
        delay: 5000, // Delay 5s
        priority: 1,
      },
    );
  }
}

// Processor
@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  async process(job: Job) {
    switch (job.name) {
      case 'welcome':
        // Send email
        break;
    }
  }
}
```

## API Documentation

### Swagger UI
Khi server chạy, truy cập: http://localhost:3333/docs

Swagger UI cung cấp:
- Danh sách tất cả API endpoints
- Schema request/response
- Test API trực tiếp trên trình duyệt
- Authentication với JWT token

### OpenAPI Specification
File spec: `docs/openapi.json`

Sử dụng cho Frontend:
1. **Import vào Postman/Insomnia**: Import file `docs/openapi.json`
2. **Generate TypeScript types**: `npx openapi-typescript docs/openapi.json -o src/types/api.ts`
3. **Generate axios hooks**: Sử dụng [orval](https://orval.dev/)

### Cập nhật API Documentation
Khi thêm API mới:
1. Thêm decorator Swagger vào controller
2. Chạy: `pnpm openapi:generate` hoặc `make openapi`
3. File `docs/openapi.json` sẽ được cập nhật

Xem chi tiết tại: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## Docker Services

| Service    | Port | Description   |
| ---------- | ---- | ------------- |
| PostgreSQL | 5432 | Database      |
| Redis      | 6379 | Cache & Queue |
| MinIO      | 9000 | Storage       |

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Reset data
docker compose down -v
```
