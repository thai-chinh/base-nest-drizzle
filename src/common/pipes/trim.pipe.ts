import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Trim Pipe
 *
 * Trims whitespace from string values in the request body.
 * Works recursively on objects.
 *
 * @example
 * // Apply globally:
 * app.useGlobalPipes(new TrimPipe());
 *
 * // Or per route:
 * @Post()
 * create(@Body(TrimPipe) dto: CreateDto) { ... }
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only transform body and query params
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    return this.trimValue(value);
  }

  private trimValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.trimValue(item));
    }

    if (value !== null && typeof value === 'object') {
      const trimmed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        trimmed[key] = this.trimValue(val);
      }
      return trimmed;
    }

    return value;
  }
}
