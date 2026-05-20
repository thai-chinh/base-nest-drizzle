import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiErrorResponse } from '../types';

interface RawResponse {
  writeHead?: (status: number, headers: Record<string, string>) => void;
  end?: (data: string) => void;
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
}

interface ResponseWithRaw {
  raw?: RawResponse;
  [key: string]: unknown;
}

const CONTENT_TYPE_JSON = 'application/json';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { status, message } = this.normalizeException(exception);

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      error: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    };

    this.sendErrorResponse(response, status, errorResponse);
  }

  private normalizeException(exception: unknown): {
    status: number;
    message: string;
  } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: this.extractErrorMessage(exception.getResponse()),
      };
    }

    const fallbackStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception && typeof exception === 'object') {
      const maybeStatus =
        (exception as { status?: unknown }).status ??
        (exception as { statusCode?: unknown }).statusCode;
      const status =
        typeof maybeStatus === 'number' ? maybeStatus : fallbackStatus;

      const message =
        (exception as Error).message ||
        this.safeStringify(exception) ||
        'Internal server error';

      return { status, message };
    }

    if (typeof exception === 'string') {
      return { status: fallbackStatus, message: exception };
    }

    return { status: fallbackStatus, message: 'Internal server error' };
  }

  private extractErrorMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse !== 'object' || exceptionResponse === null) {
      return String(exceptionResponse);
    }

    const responseObj = exceptionResponse as Record<string, unknown>;

    if (responseObj.message) {
      if (Array.isArray(responseObj.message)) {
        return responseObj.message.join(', ');
      }
      if (typeof responseObj.message === 'string') {
        return responseObj.message;
      }
      return JSON.stringify(responseObj.message);
    }

    if (typeof responseObj.error === 'string') {
      return responseObj.error;
    }

    return this.safeStringify(exceptionResponse);
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private sendErrorResponse(
    response: FastifyReply | ResponseWithRaw,
    status: number,
    errorResponse: ApiErrorResponse,
  ): void {
    if (this.isFastifyReply(response)) {
      response.code(status).send(errorResponse);
      return;
    }

    const rawResponse = this.getRawResponse(response);
    const jsonResponse = JSON.stringify(errorResponse);

    if (this.hasWriteHead(rawResponse)) {
      rawResponse.writeHead(status, { 'Content-Type': CONTENT_TYPE_JSON });
      rawResponse.end(jsonResponse);
      return;
    }

    if (typeof rawResponse.statusCode !== 'undefined') {
      rawResponse.statusCode = status;
      if (rawResponse.setHeader) {
        rawResponse.setHeader('Content-Type', CONTENT_TYPE_JSON);
      }
      if (rawResponse.end) {
        rawResponse.end(jsonResponse);
      }
    }
  }

  private isFastifyReply(
    response: FastifyReply | ResponseWithRaw,
  ): response is FastifyReply {
    return (
      response !== null &&
      response !== undefined &&
      typeof (response as FastifyReply).code === 'function'
    );
  }

  private getRawResponse(
    response: FastifyReply | ResponseWithRaw,
  ): RawResponse {
    const responseWithRaw = response as ResponseWithRaw;
    return (responseWithRaw.raw || responseWithRaw) as RawResponse;
  }

  private hasWriteHead(response: RawResponse): response is RawResponse & {
    writeHead: (status: number, headers: Record<string, string>) => void;
    end: (data: string) => void;
  } {
    return (
      typeof response.writeHead === 'function' &&
      typeof response.end === 'function'
    );
  }
}
