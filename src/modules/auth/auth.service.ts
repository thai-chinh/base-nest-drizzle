import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  AuthResponseDto,
} from './dto';
import { comparePassword, hashPassword } from '@/common/utils';
import {
  ApiBadRequestException,
  ApiNotFoundException,
  ApiUnauthorizedException,
  MESSAGE_CODES,
} from '@/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authRepository.findByEmail(dto.email);

    if (!user) {
      throw new ApiNotFoundException(MESSAGE_CODES.USER.NOT_FOUND);
    }

    if (user.status !== 1) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.ACCOUNT_INACTIVE);
    }

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiBadRequestException(MESSAGE_CODES.AUTH.INVALID_PASSWORD);
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.email),
      this.signRefreshToken(user.id, user.email),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        role: user.role,
        status: user.status,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.INVALID_TOKEN);
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.INVALID_TOKEN);
    }

    const user = await this.authRepository.findById(BigInt(payload.sub));
    if (!user) {
      throw new ApiNotFoundException(MESSAGE_CODES.USER.NOT_FOUND);
    }

    if (user.status !== 1) {
      throw new ApiUnauthorizedException(MESSAGE_CODES.AUTH.ACCOUNT_INACTIVE);
    }

    const accessToken = await this.signAccessToken(user.id, user.email);
    return { accessToken };
  }

  async changePassword(userId: bigint, dto: ChangePasswordDto) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new ApiNotFoundException(MESSAGE_CODES.USER.NOT_FOUND);
    }

    const isValid = await comparePassword(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiBadRequestException(MESSAGE_CODES.AUTH.INVALID_CURRENT_PASSWORD);
    }

    const isSame = await comparePassword(dto.newPassword, user.passwordHash);
    if (isSame) {
      throw new ApiBadRequestException(MESSAGE_CODES.AUTH.NEW_PASSWORD_SAME_AS_CURRENT);
    }

    const newHash = await hashPassword(dto.newPassword);
    await this.authRepository.updatePassword(userId, newHash);

    return { message: MESSAGE_CODES.AUTH.CHANGE_PASSWORD_SUCCESS };
  }

  private signAccessToken(userId: bigint, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId.toString(), email, type: 'access' },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: (this.configService.get<string>('jwt.expiresIn') ?? '15m') as any,
      },
    );
  }

  private signRefreshToken(userId: bigint, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId.toString(), email, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d') as any,
      },
    );
  }
}
