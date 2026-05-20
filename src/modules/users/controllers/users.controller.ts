import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto';
import { ParseBigIntPipe } from '@/common/pipes';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiBadRequestException, MESSAGE_CODES } from '@/common';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  getMe(@CurrentUser('id') userId: bigint) {
    return this.usersService.getMe(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách users (có phân trang, tìm kiếm)' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findPaginated(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy user theo ID' })
  findOne(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo user mới' })
  create(@CurrentUser('id') userId: bigint, @Body() dto: CreateUserDto) {
    return this.usersService.create({ ...dto, createdBy: userId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật user' })
  update(
    @CurrentUser('id') userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, { ...dto, updatedBy: userId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa user (soft delete)' })
  delete(
    @CurrentUser('id') userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    if (userId === id) {
      throw new ApiBadRequestException(MESSAGE_CODES.USER.CANNOT_DELETE_SELF);
    }
    return this.usersService.delete(id, userId);
  }
}
