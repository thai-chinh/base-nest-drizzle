import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ApiBadRequestException, MESSAGE_CODES } from '@/common';
import { now } from '@/common/utils';
import { BaseRepository, DATABASE_CONNECTION } from '@/core/database';
import { DrizzleDB, Transaction } from '@/core/database/database.types';
import * as schema from '@/core/database/schema/app.schema';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthRepository extends BaseRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) db: DrizzleDB,
    @InjectPinoLogger(AuthRepository.name)
    private readonly logger: PinoLogger,
  ) {
    super(db);
  }

  async findByEmail(email: string, tx?: Transaction) {
    try {
      const [user] = await this.getDb(tx)
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.email, email.toLowerCase()),
            isNull(schema.users.deletedAt),
          ),
        )
        .limit(1);
      return user ?? null;
    } catch (error) {
      this.logger.error(`[AuthRepository] findByEmail: ${error}`);
      throw new ApiBadRequestException(MESSAGE_CODES.USER.FIND_BY_EMAIL_FAILED);
    }
  }

  async findById(id: bigint, tx?: Transaction) {
    try {
      const [user] = await this.getDb(tx)
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)))
        .limit(1);
      return user ?? null;
    } catch (error) {
      this.logger.error(`[AuthRepository] findById: ${error}`);
      throw new ApiBadRequestException(MESSAGE_CODES.USER.FIND_BY_ID_FAILED);
    }
  }

  async updatePassword(userId: bigint, passwordHash: string, tx?: Transaction) {
    try {
      const [user] = await this.getDb(tx)
        .update(schema.users)
        .set({ passwordHash, updatedAt: now() })
        .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)))
        .returning();
      return user ?? null;
    } catch (error) {
      this.logger.error(`[AuthRepository] updatePassword: ${error}`);
      throw new ApiBadRequestException(MESSAGE_CODES.USER.UPDATE_PASSWORD_FAILED);
    }
  }
}
