import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions/api.exception';
import { MESSAGE_CODES } from '../constants/message-codes';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * @example
 * @Get(':id')
 * findOne(@Param('id', ParseUUIDPipe) id: string) { ... }
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID_REGEX.test(value)) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }
    return value;
  }
}
