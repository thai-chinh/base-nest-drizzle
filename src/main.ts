import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import { HttpExceptionFilter } from '@/common/filters';
import {
  TransformInterceptor,
  TimeoutInterceptor,
  LoggingInterceptor,
} from '@/common/interceptors';
import { TrimPipe } from '@/common/pipes';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
    }),
    {
      bufferLogs: true,
    },
  );

  app.useLogger(app.get(Logger));

  // Global prefix — tất cả API đều có dạng /api/...
  // Exclude: /health* và /docs (Swagger UI)
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/health/live', '/health/ready', '/docs', '/docs-json'],
  });

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(80000),
    new TransformInterceptor(),
  );

  app.useGlobalPipes(
    new TrimPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Swagger ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WedTech API')
      .setDescription('Backend API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // giữ token sau khi refresh trang
      },
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  await app.register(compress, {
    encodings: ['gzip', 'deflate'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port: Number(port), host });

  const logger = app.get(Logger);
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
