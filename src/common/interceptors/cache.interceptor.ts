import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/core/redis';

export const CACHE_KEY = 'cache_ttl';

/**
 * Cache decorator to set cache TTL for a route
 *
 * @example
 * @CacheTTL(60) // Cache for 60 seconds
 * @Get('popular')
 * getPopular() { ... }
 */
export const CacheTTL =
  (ttlSeconds: number) =>
  (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(CACHE_KEY, ttlSeconds, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(CACHE_KEY, ttlSeconds, target);
    return target;
  };

/**
 * Skip cache for a route
 */
export const NoCache =
  () =>
  (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(CACHE_KEY, 0, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(CACHE_KEY, 0, target);
    return target;
  };

/**
 * Cache Interceptor using Redis
 *
 * Caches GET request responses to improve performance.
 * Only caches successful responses.
 *
 * @example
 * // Apply to specific routes:
 * @UseInterceptors(CacheInterceptor)
 * @CacheTTL(300) // 5 minutes
 * @Get('expensive-data')
 * getExpensiveData() { ... }
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly defaultTtl = 60; // 1 minute

  constructor(
    private reflector: Reflector,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const ttl = this.reflector.getAllAndOverride<number>(CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip cache if TTL is 0 or not set
    if (ttl === 0) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = await this.redis.get(cacheKey);

    if (cachedResponse) {
      // Return cached response
      return of(JSON.parse(cachedResponse));
    }

    const cacheTtl = ttl ?? this.defaultTtl;

    return next.handle().pipe(
      tap((response) => {
        // Cache the response
        this.redis
          .setex(cacheKey, cacheTtl, JSON.stringify(response))
          .catch(() => {
            // Optionally handle cache errors
          });
      }),
    );
  }

  private generateCacheKey(request: FastifyRequest): string {
    const { method, url } = request;
    // Include query params in cache key
    return `cache:${method}:${url}`;
  }
}

/**
 * Helper to invalidate cache
 */
export async function invalidateCache(
  redis: Redis,
  pattern: string,
): Promise<void> {
  const keys = await redis.keys(`cache:*${pattern}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
