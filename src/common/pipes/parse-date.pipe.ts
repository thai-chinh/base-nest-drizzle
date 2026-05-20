import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions/api.exception';
import { MESSAGE_CODES } from '../constants/message-codes';

interface ParseDateOptions {
  optional?: boolean;
}

/**
 * Parse Date Pipe
 *
 * Parses string to Date object.
 * Accepts ISO 8601 format and common date formats.
 *
 * @example
 * @Get()
 * findByDate(@Query('date', ParseDatePipe) date: Date) { ... }
 *
 * @Get()
 * findByRange(
 *   @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
 *   @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
 * ) { ... }
 */
@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date | undefined> {
  constructor(private readonly options: ParseDateOptions = {}) {}

  transform(value: string): Date | undefined {
    if (this.options.optional && (value === undefined || value === '')) {
      return undefined;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    return date;
  }
}
