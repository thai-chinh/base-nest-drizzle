import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersRepository } from './users.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
  UserResponseDto,
} from './dto';
import { hashPassword } from '@/common/utils';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import {
  ApiConflictException,
  ApiNotFoundException,
  MESSAGE_CODES,
} from '@/common';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: bigint) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new ApiNotFoundException(MESSAGE_CODES.USER.NOT_FOUND);
    return plainToInstance(UserResponseDto, user);
  }

  async findPaginated(query: QueryUserDto) {
    const { page = 1, limit = 20, search, role, status } = query;
    const { data, total } = await this.usersRepository.findPaginated({
      page,
      limit,
      search,
      role,
      status,
    });
    return {
      data: plainToInstance(UserResponseDto, data),
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async create(dto: CreateUserDto & { createdBy: bigint }) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ApiConflictException(MESSAGE_CODES.USER.EMAIL_EXISTS);
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      createdBy: dto.createdBy,
    });
    return plainToInstance(UserResponseDto, user);
  }

  async update(id: bigint, dto: UpdateUserDto & { updatedBy: bigint }) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new ApiNotFoundException(MESSAGE_CODES.USER.NOT_FOUND);
    }
    if (existing.version !== dto.version) {
      throw new ApiConflictException(MESSAGE_CODES.COMMON.VERSION_CONFLICT);
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await hashPassword(dto.password);
    }

    const updated = await this.usersRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      passwordHash,
      role: dto.role,
      status: dto.status,
      version: dto.version,
      updatedBy: dto.updatedBy,
    });

    if (!updated) {
      throw new ApiConflictException(MESSAGE_CODES.COMMON.VERSION_CONFLICT);
    }
    return plainToInstance(UserResponseDto, updated);
  }

  async delete(id: bigint, deletedBy: bigint) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new ApiNotFoundException(MESSAGE_CODES.USER.NOT_FOUND);
    }
    const deleted = await this.usersRepository.softDelete(id, deletedBy);
    return plainToInstance(UserResponseDto, deleted);
  }

  async getMe(userId: bigint) {
    return this.findById(userId);
  }
}
