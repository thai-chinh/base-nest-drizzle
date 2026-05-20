# API Documentation

## Swagger UI

Khi server chạy, bạn có thể truy cập Swagger UI tại:

```
http://localhost:3333/docs
```

Swagger UI cung cấp:
- Danh sách tất cả API endpoints
- Schema request/response
- Khả năng test API trực tiếp trên trình duyệt
- Authentication với JWT token

## OpenAPI Specification

File OpenAPI spec được lưu tại: `docs/openapi.json`

### Cách sử dụng cho Frontend

#### 1. Import vào Postman / Insomnia
- Mở Postman/Insomnia
- Chọn Import → File → Chọn `docs/openapi.json`
- Tất cả API sẽ được import với đầy đủ thông tin

#### 2. Generate TypeScript types
```bash
# Cài đặt openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript docs/openapi.json -o src/types/api.ts
```

#### 3. Generate axios hooks với orval
```bash
# Cài đặt orval
npm install -D orval

# Tạo file config orval.config.js
# Xem ví dụ tại: https://orval.dev/guides/openapi
```

#### 4. Sử dụng với fetch/axios
```typescript
import type { paths } from './types/api';

// Type-safe API calls
async function login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  return response.json();
}
```

## Cập nhật API Documentation

### Khi thêm API mới
1. Thêm decorator Swagger vào controller:
```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll() {
    // ...
  }
}
```

2. Chạy generate OpenAPI spec:
```bash
# Cách 1: Dùng npm script
npm run openapi:generate

# Cách 2: Dùng Makefile
make openapi
```

3. File `docs/openapi.json` sẽ được cập nhật tự động

### Các decorator Swagger thường dùng
- `@ApiTags('Tên nhóm')`: Nhóm API theo module
- `@ApiOperation({ summary: 'Mô tả' })`: Mô tả API
- `@ApiResponse({ status: 200, description: 'Thành công' })`: Mô tả response
- `@ApiBody({ type: CreateUserDto })`: Mô tả request body
- `@ApiParam({ name: 'id', description: 'User ID' })`: Mô tả path parameter
- `@ApiQuery({ name: 'page', required: false })`: Mô tả query parameter
- `@ApiBearerAuth('access-token')`: Xác định API cần JWT token

## API Structure

### Base URL
```
http://localhost:3333/api/v1
```

### Authentication
- Tất cả API (trừ auth endpoints) đều yêu cầu JWT token
- Gửi token trong header: `Authorization: Bearer <token>`

### Health Check
```
GET /health          # Full health check (db, redis, storage)
GET /health/live     # Liveness probe
GET /health/ready    # Readiness probe
```

### Auth Endpoints
```
POST   /auth/login     # Đăng nhập
POST   /auth/register  # Đăng ký
POST   /auth/logout    # Đăng xuất
POST   /auth/refresh   # Refresh token
```

### Users Endpoints
```
GET    /users          # Danh sách users
GET    /users/:id      # Chi tiết user
POST   /users          # Tạo user mới
PATCH  /users/:id      # Cập nhật user
DELETE /users/:id      # Xóa user
```

## Best Practices

### 1. Luôn cập nhật Swagger decorator
Khi thêm/sửa API, luôn cập nhật decorator Swagger để documentation luôn chính xác.

### 2. Kiểm tra OpenAPI spec
Sau khi generate, kiểm tra file `docs/openapi.json` có hợp lệ không:
```bash
# Validate OpenAPI spec
npx @redocly/cli lint docs/openapi.json
```

### 3. Đồng bộ với Frontend
Sau khi update API, chạy generate types để frontend có type definitions mới nhất.

### 4. Versioning
- API version hiện tại: `v1`
- Khi có breaking changes, tạo version mới: `v2`
- Giữ backward compatibility khi có thể

## Troubleshooting

### Swagger UI không hiển thị
- Kiểm tra server đã chạy chưa: `http://localhost:3333`
- Kiểm tra Swagger config trong `src/main.ts`
- Kiểm tra global prefix có exclude `/docs` không

### OpenAPI generation failed
- Kiểm tra lỗi trong console
- Đảm bảo có file `.env` với các biến cần thiết
- Kiểm tra StorageService có xử lý được trường hợp config undefined không

### Types không match
- Xóa cache TypeScript: `rm -rf node_modules/.cache`
- Chạy lại type generation
- Kiểm tra schema trong DTO có đúng không