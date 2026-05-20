import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { toBigIntId } from '../utils/id.util';

/**
 * Get current authenticated user from request
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) { return user; }
 *
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) { return userId; }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = (
      request as FastifyRequest & { user?: Record<string, unknown> }
    ).user;

    if (!user) {
      return null;
    }

    if (data) {
      const value = user[data];
      if (data === 'id' && typeof value === 'string') {
        return toBigIntId(value);
      }
      return value;
    }

    return user;
  },
);
