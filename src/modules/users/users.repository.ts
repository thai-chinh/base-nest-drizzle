import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull, count, or, sql } from 'drizzle-orm';
import { ApiBadRequestException, MESSAGE_CODES } from '@/common';
import { generateSnowflakeId, now } from '@/common/utils';
import { BaseRepository, DATABASE_CONNECTION } from '@/core/database';
import { DrizzleDB, Transaction } from '@/core/database/database.types';
import * as schema from '@/core/database/schema/app.schema';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) db: DrizzleDB,
    @InjectPinoLogger(UsersRepository.name)
    private readonly logger: PinoLogger,
  ) {
    super(db);
  }

  async findById(id: bigint, tx?: Transaction) {
    const [user] = await this.getDb(tx)
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        phone: schema.users.phone,
        avatarUrl: schema.users.avatarUrl,
        role: schema.users.role,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        version: schema.users.version,
      })
      .from(schema.users)
      .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)))
      .limit(1);
    return user ?? null;
  }

  async findByEmail(email: string, tx?: Transaction) {
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
  }

  async findPaginated(
    params: {
      page: number;
      limit: number;
      search?: string;
      role?: string;
      status?: number;
    },
    tx?: Transaction,
  ) {
    try {
      const { page, limit, search, role, status } = params;
      const offset = (page - 1) * limit;
      const conditions = [isNull(schema.users.deletedAt)];

      if (search) {
        const p = `%${search}%`;
        conditions.push(
          or(
            sql`public.unaccent(${schema.users.firstName}) ILIKE public.unaccent(${p})`,
            sql`public.unaccent(${schema.users.lastName}) ILIKE public.unaccent(${p})`,
            sql`public.unaccent(${schema.users.email}) ILIKE public.unaccent(${p})`,
          )!,
        );
      }
      if (role) conditions.push(eq(schema.users.role, role));
      if (status !== undefined) conditions.push(eq(schema.users.status, status));

      const db = this.getDb(tx);
      const [data, [{ total }]] = await Promise.all([
        db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            phone: schema.users.phone,
            avatarUrl: schema.users.avatarUrl,
            role: schema.users.role,
            status: schema.users.status,
            createdAt: schema.users.createdAt,
            updatedAt: schema.users.updatedAt,
            version: schema.users.version,
          })
          .from(schema.users)
          .where(and(...conditions))
          .orderBy(schema.users.createdAt)
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(schema.users)
          .where(and(...conditions)),
      ]);
      return { data, total };
    } catch (error) {
      this.logger.error(error);
      throw new ApiBadRequestException(MESSAGE_CODES.USER.FIND_PAGINATED_FAILED);
    }
  }

  async create(
    data: {
      email: string;
      passwordHash: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      createdBy?: bigint;
    },
    tx?: Transaction,
  ) {
    try {
      const [user] = await this.getDb(tx)
        .insert(schema.users)
        .values({
          id: generateSnowflakeId(),
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          phone: data.phone ?? null,
          role: data.role ?? 'user',
          createdBy: data.createdBy ?? null,
        })
        .returning();
      return user;
    } catch (error) {
      this.logger.error(error);
      throw new ApiBadRequestException(MESSAGE_CODES.USER.CREATE_FAILED);
    }
  }

  async update(
    id: bigint,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
      passwordHash?: string;
      role?: string;
      status?: number;
      version: number;
      updatedBy: bigint;
    },
    tx?: Transaction,
  ) {
    try {
      const [user] = await this.getDb(tx)
        .update(schema.users)
        .set({
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.passwordHash && { passwordHash: data.passwordHash }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.status !== undefined && { status: data.status }),
          updatedBy: data.updatedBy,
          updatedAt: now(),
          version: sql`${schema.users.version} + 1`,
        })
        .where(
          and(
            eq(schema.users.id, id),
            eq(schema.users.version, data.version),
            isNull(schema.users.deletedAt),
          ),
        )
        .returning();
      return user ?? null;
    } catch (error) {
      this.logger.error(error);
      throw new ApiBadRequestException(MESSAGE_CODES.USER.UPDATE_FAILED);
    }
  }

  async softDelete(id: bigint, deletedBy: bigint, tx?: Transaction) {
    const [user] = await this.getDb(tx)
      .update(schema.users)
      .set({ deletedAt: now(), deletedBy })
      .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)))
      .returning();
    return user ?? null;
  }
}
