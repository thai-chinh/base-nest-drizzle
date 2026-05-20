import { PipeTransform, Injectable } from '@nestjs/common';
import { ApiBadRequestException } from '../exceptions/api.exception';
import { MESSAGE_CODES } from '../constants/message-codes';
import { toBigIntId } from '../utils/id.util';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    if (!value) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    if (!/^\d+$/.test(value)) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }

    const id = toBigIntId(value);
    if (!id) {
      throw new ApiBadRequestException(MESSAGE_CODES.COMMON.VALIDATION_ERROR);
    }
    return id;
  }
}
