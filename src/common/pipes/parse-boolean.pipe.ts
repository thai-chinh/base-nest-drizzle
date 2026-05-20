import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions/api.exception';
import { MESSAGE_CODES } from '../constants/message-codes';

interface ParseBooleanOptions {
  optional?: boolean;
}

/**
 * Parse Boolean Pipe
 *
 * Parses string to boolean.
 * Accepts: true/false, 1/0, yes/no
 *
 * @example
 * @Get()
 * findAll(@Query('active', ParseBooleanPipe) active: boolean) { ... }
 *
 * @Get()
 * findAll(@Query('archived', new ParseBooleanPipe({ optional: true })) archived?: boolean) { ... }
 */
@Injectable()
export class ParseBooleanPipe implements PipeTransform<
  string,
  boolean | undefined
> {
  private readonly trueValues = ['true', '1', 'yes'];
  private readonly falseValues = ['false', '0', 'no'];

  constructor(private readonly options: ParseBooleanOptions = {}) {}

  transform(value: string): boolean | undefined {
    if (this.options.optional && (value === undefined || value === '')) {
      return undefined;
    }

    const lowerValue = String(value).toLowerCase();

    if (this.trueValues.includes(lowerValue)) {
      return true;
    }

    if (this.falseValues.includes(lowerValue)) {
      return false;
    }

    throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
  }
}
