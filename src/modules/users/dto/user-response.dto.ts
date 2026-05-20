import { Transform } from 'class-transformer';

export class UserResponseDto {
  @Transform(({ value }) => value?.toString())
  id: string;

  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;

  @Transform(({ value }) => value?.toString())
  version: number;
}
