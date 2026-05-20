import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    public readonly code: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(code, statusCode);
  }
}

/**
 * Not Found Exception
 */
export class ApiNotFoundException extends ApiException {
  constructor(code: string) {
    super(code, HttpStatus.NOT_FOUND);
  }
}

/**
 * Conflict Exception
 */
export class ApiConflictException extends ApiException {
  constructor(code: string) {
    super(code, HttpStatus.CONFLICT);
  }
}

/**
 * Bad Request Exception
 */
export class ApiBadRequestException extends ApiException {
  constructor(code: string) {
    super(code, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Unauthorized Exception
 */
export class ApiUnauthorizedException extends ApiException {
  constructor(code: string) {
    super(code, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Forbidden Exception
 */
export class ApiForbiddenException extends ApiException {
  constructor(code: string) {
    super(code, HttpStatus.FORBIDDEN);
  }
}
