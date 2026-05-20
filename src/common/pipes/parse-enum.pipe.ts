import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions/api.exception';
import { MESSAGE_CODES } from '../constants/message-codes';

interface ParseEnumOptions<T> {
  enum: Record<string, T>;
  optional?: boolean;
}

/**
 * Parse Enum Pipe
 *
 * Validates and transforms string to enum value.
 *
 * @example
 * enum Status { ACTIVE = 'active', INACTIVE = 'inactive' }
 *
 * @Get()
 * findByStatus(@Query('status', new ParseEnumPipe({ enum: Status })) status: Status) { ... }
 */
@Injectable()
export class ParseEnumPipe<T> implements PipeTransform<string, T | undefined> {
  constructor(private readonly options: ParseEnumOptions<T>) {}

  transform(value: string): T | undefined {
    if (this.options.optional && (value === undefined || value === '')) {
      return undefined;
    }

    const enumValues = Object.values(this.options.enum);

    if (!enumValues.includes(value as T)) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    return value as T;
  }
}
