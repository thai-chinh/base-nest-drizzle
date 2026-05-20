/**
 * Generate OpenAPI spec file → docs/openapi.json
 *
 * Usage:
 *   yarn openapi:generate   (hoặc: npm run openapi:generate)
 *
 * Output: docs/openapi.json
 *
 * FE dùng file này để:
 *   - Import vào Postman / Insomnia
 *   - Generate TypeScript types: npx openapi-typescript docs/openapi.json -o src/types/api.ts
 *   - Generate axios hooks với orval
 *
 * Lưu ý: cần có .env hoặc DATABASE_URL hợp lệ để app khởi động được
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function generate() {
  console.log('🔄 Generating OpenAPI spec...');

  let app: NestFastifyApplication | undefined;

  try {
    // Set minimal environment variables for storage service
    process.env.STORAGE_PROVIDER = 'minio';
    process.env.MINIO_ENDPOINT = 'http://localhost:9000';
    process.env.MINIO_ACCESS_KEY_ID = 'dummy-key';
    process.env.MINIO_SECRET_ACCESS_KEY = 'dummy-secret';
    process.env.MINIO_BUCKET = 'dummy-bucket';

    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { 
        logger: ['error', 'warn'],
        // Disable some services that might cause issues
        abortOnError: false,
      },
    );

    app.setGlobalPrefix('api', {
      exclude: ['/health', '/health/live', '/health/ready'],
    });

    const config = new DocumentBuilder()
      .setTitle('WedTech API')
      .setDescription('Backend API documentation')
      .setVersion('1.0')
      .addServer('/api', 'API v1')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const outputDir = join(process.cwd(), 'docs');
    mkdirSync(outputDir, { recursive: true });

    const outputPath = join(outputDir, 'openapi.json');
    writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

    console.log(`✅ OpenAPI spec generated: ${outputPath}`);
  } catch (err) {
    console.error('❌ Failed to generate OpenAPI spec:');
    console.error(err);
    process.exit(1);
  } finally {
    if (app) {
      await app.close().catch(() => {});
    }
  }
}

generate();
