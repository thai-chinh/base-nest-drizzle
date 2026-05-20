import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions/api.exception';
import { MESSAGE_CODES } from '../constants/message-codes';

interface ParseIntOptions {
  min?: number;
  max?: number;
  optional?: boolean;
}

/**
 * Enhanced Parse Int Pipe
 *
 * Parses string to integer with optional min/max validation.
 *
 * @example
 * @Get(':id')
 * findOne(@Param('id', new ParseIntPipe({ min: 1 })) id: number) { ... }
 *
 * @Get()
 * findAll(@Query('page', new ParseIntPipe({ min: 1, optional: true })) page?: number) { ... }
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number | undefined> {
  constructor(private readonly options: ParseIntOptions = {}) {}

  transform(value: string): number | undefined {
    if (this.options.optional && (value === undefined || value === '')) {
      return undefined;
    }

    const num = parseInt(value, 10);

    if (isNaN(num)) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    if (this.options.min !== undefined && num < this.options.min) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    if (this.options.max !== undefined && num > this.options.max) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    return num;
  }
}
