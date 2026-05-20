import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');

        const redis = new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          maxRetriesPerRequest: null, // Required for BullMQ
          enableReadyCheck: false,
          retryStrategy: (times) => {
            if (times > 10) {
              logger.error('Redis: Max retries reached, giving up');
              return null;
            }
            const delay = Math.min(times * 100, 3000);
            logger.warn(
              `Redis: Retry attempt ${times}, next retry in ${delay}ms`,
            );
            return delay;
          },
        });

        redis.on('error', (err) => {
          logger.error('Redis connection error:', err.message);
        });

        redis.on('connect', () => {
          logger.log('Redis connected successfully');
        });

        redis.on('ready', () => {
          logger.log('Redis is ready');
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
