# Hướng dẫn Logging trong WedTech Backend

## 📊 **NODE_ENV Differences**

### **Development (`NODE_ENV=development`):**
- **Log level**: `debug` (log tất cả)
- **Format**: Pretty print với màu sắc
- **HTTP logs**: Log tất cả requests/responses
- **Stack traces**: Có đầy đủ stack trace
- **Swagger UI**: Có (`/docs`)
- **Performance logs**: Log tất cả (> 100ms)
- **DB logs**: Log tất cả queries (> 50ms)

### **Production (`NODE_ENV=production`):**
- **Log level**: `info` (chỉ log quan trọng)
- **Format**: JSON (cho parsing bởi log aggregators)
- **HTTP logs**: Chỉ log slow requests (> 1s) và errors
- **Stack traces**: Không có (chỉ error message)
- **Swagger UI**: Không có
- **Performance logs**: Chỉ log nếu > 1s
- **DB logs**: Chỉ log slow queries (> 500ms)

## 🎯 **Cách sử dụng Enhanced Logger**

### **1. Import và tạo logger:**
```typescript
import { createLogger } from '@/common/utils/logger.util';

export class MyService {
  private readonly logger = createLogger(MyService.name);
  
  async myMethod() {
    // Sử dụng các methods dưới đây
  }
}
```

### **2. Các log levels:**

#### **A. Debug (chỉ development)**
```typescript
this.logger.debug('Debug message', { data: 'only in dev' });
// Production: KHÔNG log
// Development: CÓ log
```

#### **B. Info (cả dev và prod)**
```typescript
this.logger.info('User logged in', { userId: 123, email: 'user@example.com' });
// Production: CÓ log (email sẽ bị redact)
// Development: CÓ log
```

#### **C. Warn (cả dev và prod)**
```typescript
this.logger.warn('Rate limit approaching', { userId: 123, requests: 95 });
// Production: CÓ log
// Development: CÓ log
```

#### **D. Error (cả dev và prod)**
```typescript
try {
  // some operation
} catch (error) {
  this.logger.error('Failed to process order', error, { orderId: 456 });
  // Production: log error message + code (no stack)
  // Development: log full error với stack trace
}
```

#### **E. Critical (luôn log full details)**
```typescript
this.logger.critical('Database connection lost', error, { 
  service: 'payment',
  attempt: 3 
});
// Luôn log với stack trace, cả dev và prod
```

### **3. Specialized logs:**

#### **Business events:**
```typescript
this.logger.business('ORDER_CREATED', {
  orderId: 123,
  amount: 100.50,
  currency: 'USD',
  userId: 456,
});
// Luôn logged, structured cho analytics
```

#### **Performance tracking:**
```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

this.logger.performance('ProcessPayment', duration, {
  orderId: 123,
  paymentMethod: 'credit_card',
});
// Dev: log tất cả > 100ms
// Prod: chỉ log > 1000ms
```

#### **Database queries:**
```typescript
const startTime = Date.now();
const result = await this.usersRepository.findById(userId);
const duration = Date.now() - startTime;

this.logger.dbQuery('findById', 'users', duration, {
  userId,
  rowsReturned: result ? 1 : 0,
});
// Dev: log tất cả > 50ms
// Prod: chỉ log > 500ms
```

#### **HTTP requests (tự động bởi LoggingInterceptor):**
```typescript
// Không cần gọi trực tiếp
// Tự động log bởi interceptor
```

## 🔒 **Security & Redaction**

### **Tự động redact các field nhạy cảm:**
- `password`, `token`, `secret`, `key`
- `accessToken`, `refreshToken`, `authorization`
- `email`, `phone`, `creditCard`, `ssn`, `cvv`
- `req.headers.cookie`, `req.body.password`

**Ví dụ:**
```typescript
this.logger.info('User data', {
  userId: 123,
  email: 'user@example.com', // → '[REDACTED]'
  password: 'secret123',      // → '[REDACTED]'
  token: 'abc123',           // → '[REDACTED]'
  name: 'John Doe',          // → giữ nguyên
});
```

## 📈 **Log Structure**

### **Development format (pretty):**
```
[10:30:15.123] DEBUG HTTP → GET /api/users | IP: 127.0.0.1 | Agent: Chrome | ID: req-123
```

### **Production format (JSON):**
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:15.123Z",
  "pid": 12345,
  "hostname": "server-1",
  "type": "HTTP_REQUEST",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "durationMs": 45,
  "requestId": "req-123",
  "userId": 456,
  "ip": "127.0.0.1",
  "userAgent": "Chrome",
  "service": "wedtech-be",
  "env": "production"
}
```

## 🛠 **Configuration**

### **File: `src/core/logger/logger.config.ts`**
```typescript
// Development: pino-pretty transport
// Production: JSON format, autoLogging: false
// Custom log levels per environment
```

### **Environment variables:**
```bash
# .env
NODE_ENV=development  # hoặc production
LOG_LEVEL=debug       # override mặc định
LOG_PRETTY=true       # force pretty print
```

## 🎪 **Best Practices**

### **1. Log đủ context:**
```typescript
// TỐT
this.logger.error('Payment failed', error, {
  orderId: 123,
  paymentMethod: 'credit_card',
  amount: 100.50,
  userId: 456,
});

// KHÔNG TỐT
this.logger.error('Payment failed', error);
```

### **2. Sử dụng đúng level:**
- `debug`: Chi tiết debugging (dev only)
- `info`: Thông tin hoạt động bình thường
- `warn`: Cảnh báo, không phải lỗi
- `error`: Lỗi cần xử lý
- `critical`: Lỗi nghiêm trọng ảnh hưởng hệ thống

### **3. Structured logging:**
```typescript
// TỐT - structured
this.logger.business('USER_REGISTERED', {
  userId: 123,
  email: '[REDACTED]',
  source: 'web',
  timestamp: new Date().toISOString(),
});

// KHÔNG TỐT - unstructured
console.log(`User registered: ${userId} from web`);
```

### **4. Performance tracking:**
```typescript
// Luôn track performance cho operations quan trọng
const startTime = Date.now();
await this.processOrder(orderId);
const duration = Date.now() - startTime;

this.logger.performance('processOrder', duration, { orderId });
```

## 🔍 **Debugging trong Development**

### **Enable verbose logging:**
```typescript
// Trong service của bạn
this.logger.verbose('Detailed debug info', {
  requestBody: request.body,
  queryParams: request.query,
  headers: request.headers,
});
```

### **Tracing với correlation ID:**
```typescript
// Tự động có requestId từ Fastify
this.logger.info('Processing request', {
  requestId: request.id,
  userId: request.user?.id,
  // ... other context
});
```

## 🚀 **Production Monitoring**

### **Các metrics cần monitor:**
1. **Error rate**: `level: 'error'`
2. **Slow requests**: `durationMs >= 1000`
3. **Slow queries**: `durationMs >= 500`
4. **Business events**: `type: 'BUSINESS'`
5. **Critical errors**: `level: 'CRITICAL'`

### **Alerting thresholds:**
- Error rate > 1% trong 5 phút
- Request duration p95 > 2s
- Database query duration p95 > 1s
- Critical errors bất kỳ

## 📋 **Tóm tắt**

### **Development:**
- Log tất cả mọi thứ
- Pretty format với màu sắc
- Đầy đủ stack traces
- Chi tiết debugging

### **Production:**
- Chỉ log quan trọng
- JSON format cho parsing
- Không có stack traces (trừ critical)
- Redact sensitive data
- Chỉ log slow operations và errors

### **Luôn sử dụng:**
```typescript
import { createLogger } from '@/common/utils/logger.util';
const logger = createLogger(MyService.name);
```

*File này không commit vào git (đã thêm vào .gitignore)*