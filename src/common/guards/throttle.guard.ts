import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/core/redis';

export const THROTTLE_KEY = 'throttle';

interface ThrottleOptions {
  limit: number; // Max requests
  ttl: number; // Time window in seconds
}

/**
 * Throttle decorator to set rate limit for a route
 *
 * @example
 * @Throttle({ limit: 5, ttl: 60 }) // 5 requests per 60 seconds
 * @Post('login')
 * login() { ... }
 */
export const Throttle =
  (options: ThrottleOptions) =>
  (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(THROTTLE_KEY, options, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(THROTTLE_KEY, options, target);
    return target;
  };

/**
 * Skip throttle for a route
 */
export const SkipThrottle =
  () =>
  (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(THROTTLE_KEY, null, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(THROTTLE_KEY, null, target);
    return target;
  };

/**
 * Rate Limiting Guard using Redis
 *
 * Prevents abuse by limiting the number of requests from a single IP/user.
 *
 * @example
 * // Apply globally with default limits:
 * app.useGlobalGuards(new ThrottleGuard(reflector, redis));
 *
 * // Or per route with custom limits:
 * @Throttle({ limit: 3, ttl: 60 })
 * @Post('password-reset')
 * resetPassword() { ... }
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly defaultLimit = 100;
  private readonly defaultTtl = 60; // 1 minute

  constructor(
    private reflector: Reflector,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ThrottleOptions | null>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Skip throttle if explicitly disabled
    if (options === null) {
      return true;
    }

    const limit = options?.limit ?? this.defaultLimit;
    const ttl = options?.ttl ?? this.defaultTtl;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const key = this.generateKey(request);

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, ttl);
    }

    if (current > limit) {
      const retryAfter = await this.redis.ttl(key);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private generateKey(request: FastifyRequest): string {
    const ip = request.ip || 'unknown';
    const path = request.routeOptions?.url || request.url;
    const method = request.method;
    return `throttle:${ip}:${method}:${path}`;
  }
}
