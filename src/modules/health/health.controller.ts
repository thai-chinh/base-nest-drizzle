import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import Redis from 'ioredis';
import { sql } from 'drizzle-orm';
import { REDIS_CLIENT } from '@/core/redis/redis.module';
import { DATABASE_CONNECTION } from '@/core/database/database.utils';
import { DrizzleDB } from '@/core/database/database.types';
import { StorageService } from '@/core/storage/storage.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Full health check (db, redis, storage)' })
  async check() {
    const [redisStatus, dbStatus, storageStatus] = await Promise.all([
      this.checkRedis(),
      this.checkDatabase(),
      this.checkStorage(),
    ]);

    const isAllOk =
      redisStatus === 'connected' &&
      dbStatus === 'connected' &&
      storageStatus === 'connected';

    const memoryUsage = process.memoryUsage();

    const response = {
      status: isAllOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: redisStatus,
        database: dbStatus,
        storage: storageStatus,
      },
      system: {
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        },
      },
    };

    if (!isAllOk) {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — luôn trả về ok nếu process đang chạy' })
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — kiểm tra db + redis' })
  async ready() {
    const [redisStatus, dbStatus] = await Promise.all([
      this.checkRedis(),
      this.checkDatabase(),
    ]);

    if (redisStatus !== 'connected' || dbStatus !== 'connected') {
      throw new ServiceUnavailableException({
        status: 'error',
        services: { redis: redisStatus, database: dbStatus },
      });
    }

    return { status: 'ok' };
  }

  private async checkRedis(): Promise<'connected' | 'disconnected'> {
    try {
      await this.redis.ping();
      return 'connected';
    } catch (err: any) {
      this.logger.error(`Redis health check failed: ${err.message}`);
      return 'disconnected';
    }
  }

  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return 'connected';
    } catch (err: any) {
      this.logger.error(`Database health check failed: ${err.message}`);
      return 'disconnected';
    }
  }

  private async checkStorage(): Promise<'connected' | 'disconnected'> {
    try {
      await this.storageService.checkConnection();
      return 'connected';
    } catch (err: any) {
      this.logger.error(`Storage health check failed: ${err.message}`);
      return 'disconnected';
    }
  }
}
