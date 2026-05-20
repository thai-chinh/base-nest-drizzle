import { Logger } from '@nestjs/common';

/**
 * Enhanced Logger Utility
 * 
 * Provides environment-aware logging with different levels for dev vs prod.
 * 
 * Usage:
 * ```typescript
 * import { createLogger } from '@/common/utils/logger.util';
 * 
 * const logger = createLogger('MyService');
 * 
 * // Development: logs everything
 * // Production: only logs info, warn, error
 * logger.debug('Debug message', { data: 'only in dev' });
 * logger.info('Info message', { userId: 123 });
 * logger.warn('Warning message', { issue: 'something' });
 * logger.error('Error message', error, { context: 'operation' });
 * ```
 */
export class EnhancedLogger {
  private readonly logger: Logger;

  constructor(private readonly context: string) {
    this.logger = new Logger(context);
  }

  /**
   * Debug log - only in development
   */
  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      const logMessage = context 
        ? `${message} ${JSON.stringify(context)}`
        : message;
      this.logger.debug(logMessage);
    }
  }

  /**
   * Verbose log - only in development (more detailed than debug)
   */
  verbose(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      const logMessage = context 
        ? `${message} ${JSON.stringify(context)}`
        : message;
      if (this.logger.verbose) {
        this.logger.verbose(logMessage);
      } else {
        this.logger.debug(logMessage);
      }
    }
  }

  /**
   * Info log - both dev and prod
   */
  info(message: string, context?: Record<string, any>): void {
    const logMessage = context 
      ? `${message} ${JSON.stringify(this.sanitizeContext(context))}`
      : message;
    this.logger.log(logMessage);
  }

  /**
   * Warn log - both dev and prod
   */
  warn(message: string, context?: Record<string, any>): void {
    const logMessage = context 
      ? `${message} ${JSON.stringify(this.sanitizeContext(context))}`
      : message;
    this.logger.warn(logMessage);
  }

  /**
   * Error log - both dev and prod
   * In production: logs error message and code only (no stack trace)
   * In development: logs full error with stack trace
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const errorContext = {
      ...this.sanitizeContext(context),
      error: {
        message: error?.message,
        name: error?.name,
        code: (error as any)?.code,
        ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack }),
      },
    };

    const logMessage = `${message} ${JSON.stringify(errorContext)}`;
    this.logger.error(logMessage);
  }

  /**
   * Critical error log - always logs with full details
   */
  critical(message: string, error?: Error, context?: Record<string, any>): void {
    const errorContext = {
      ...this.sanitizeContext(context),
      error: {
        message: error?.message,
        name: error?.name,
        code: (error as any)?.code,
        stack: error?.stack, // Always include stack for critical errors
      },
      level: 'CRITICAL',
      timestamp: new Date().toISOString(),
    };

    const logMessage = `${message} ${JSON.stringify(errorContext)}`;
    this.logger.error(logMessage);
  }

  /**
   * Business logic log - for important business events
   * Always logged in both environments
   */
  business(event: string, data: Record<string, any>): void {
    const logData = {
      event,
      ...this.sanitizeContext(data),
      level: 'BUSINESS',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    this.logger.log(JSON.stringify(logData));
  }

  /**
   * Performance log - for tracking performance metrics
   * In production: only logs if above threshold
   * In development: logs all
   */
  performance(operation: string, durationMs: number, context?: Record<string, any>): void {
    const threshold = process.env.NODE_ENV === 'production' ? 1000 : 100; // 1s prod, 100ms dev
    
    if (durationMs >= threshold) {
      const logData = {
        operation,
        durationMs,
        threshold,
        ...this.sanitizeContext(context),
        level: 'PERFORMANCE',
        timestamp: new Date().toISOString(),
      };

      this.logger.warn(JSON.stringify(logData));
    } else if (process.env.NODE_ENV !== 'production') {
      // In dev, log all performance metrics
      const logData = {
        operation,
        durationMs,
        ...this.sanitizeContext(context),
        level: 'PERFORMANCE',
        timestamp: new Date().toISOString(),
      };

      this.logger.debug(JSON.stringify(logData));
    }
  }

  /**
   * HTTP request log - structured HTTP logging
   */
  httpRequest(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    context?: Record<string, any>,
  ): void {
    const logData = {
      type: 'HTTP_REQUEST',
      method,
      url,
      statusCode,
      durationMs,
      ...this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
    };

    // Production: only log slow requests (> 1s) or errors
    if (process.env.NODE_ENV === 'production') {
      if (statusCode >= 400 || durationMs >= 1000) {
        this.logger.log(JSON.stringify(logData));
      }
    } else {
      // Development: log all requests
      this.logger.debug(JSON.stringify(logData));
    }
  }

  /**
   * Database query log - for tracking database operations
   */
  dbQuery(
    operation: string,
    table: string,
    durationMs: number,
    context?: Record<string, any>,
  ): void {
    const threshold = process.env.NODE_ENV === 'production' ? 500 : 50; // 500ms prod, 50ms dev
    
    if (durationMs >= threshold) {
      const logData = {
        type: 'DB_QUERY',
        operation,
        table,
        durationMs,
        threshold,
        ...this.sanitizeContext(context),
        timestamp: new Date().toISOString(),
      };

      this.logger.warn(JSON.stringify(logData));
    } else if (process.env.NODE_ENV !== 'production') {
      // In dev, log all slow queries
      const logData = {
        type: 'DB_QUERY',
        operation,
        table,
        durationMs,
        ...this.sanitizeContext(context),
        timestamp: new Date().toISOString(),
      };

      this.logger.debug(JSON.stringify(logData));
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> {
    if (!context) return {};

    const sanitized = { ...context };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'email',
      'phone',
      'creditCard',
      'ssn',
      'cvv',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

/**
 * Create a new EnhancedLogger instance
 */
export function createLogger(context: string): EnhancedLogger {
  return new EnhancedLogger(context);
}

/**
 * Global logger instance for quick use
 */
export const logger = createLogger('App');

/**
 * Log levels configuration per environment
 */
export const LOG_LEVELS = {
  development: {
    http: 'debug',
    db: 'debug',
    business: 'debug',
    performance: 'debug',
    error: 'error',
  },
  production: {
    http: 'info', // chỉ log slow requests và errors
    db: 'warn',   // chỉ log slow queries
    business: 'info',
    performance: 'warn', // chỉ log nếu > threshold
    error: 'error',
  },
  test: {
    http: 'silent',
    db: 'silent',
    business: 'silent',
    performance: 'silent',
    error: 'error',
  },
} as const;