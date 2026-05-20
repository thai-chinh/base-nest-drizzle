import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createLogger } from '@/common/utils/logger.util';

/**
 * Logging Interceptor
 *
 * Logs incoming requests and outgoing responses with timing information.
 * Environment-aware: logs more in dev, less in prod.
 *
 * @example
 * // Apply globally:
 * app.useGlobalInterceptors(new LoggingInterceptor());
 *
 * // Or per controller:
 * @UseInterceptors(LoggingInterceptor)
 * @Controller('users')
 * export class UsersController {}
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = createLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();

    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || 'unknown';
    const requestId = request.id;
    const userId = (request as any).user?.id;

    const startTime = Date.now();

    // Log incoming request (development only)
    this.logger.debug(`→ ${method} ${url}`, {
      ip,
      userAgent,
      requestId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Use enhanced HTTP logging
          this.logger.httpRequest(method, url, statusCode, duration, {
            requestId,
            userId,
            ip,
            userAgent,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          // Log error with context
          this.logger.error(`HTTP Error: ${method} ${url}`, error, {
            requestId,
            userId,
            ip,
            userAgent,
            durationMs: duration,
            statusCode,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
