import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { MESSAGE_CODES } from '../constants/message-codes';
import { toBigIntId } from '../utils/id.util';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { ApiUnauthorizedException } from '../exceptions';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.COMMON.MISSING_TOKEN);
    }

    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.INVALID_TOKEN);
    }

    if (payload.type && payload.type !== 'access') {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.INVALID_TOKEN);
    }

    const userId = toBigIntId(payload.sub);
    if (!userId) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.INVALID_TOKEN);
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.INVALID_TOKEN);
    }

    // status 1 = Active
    if (user.status !== 1) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.ACCOUNT_INACTIVE);
    }

    (request as FastifyRequest & { user: unknown }).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
