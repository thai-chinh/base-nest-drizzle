import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';
import { ApiResponse } from '../types';

export interface Response<T> extends ApiResponse<T> {
  success: boolean;
  code?: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            requestId: request.id,
          } as Response<T>;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          requestId: request.id,
        } as Response<T>;
      }),
    );
  }
}
