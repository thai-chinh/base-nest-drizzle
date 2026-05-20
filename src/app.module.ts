import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { appConfig, databaseConfig, redisConfig, storageConfig, jwtConfig } from '@/config';
import { CoreModule, loggerConfig } from '@/core';
import { CommonModule } from '@/common';
import { HealthModule } from '@/modules/health';
import { AuthModule } from '@/modules/auth';
import { UsersModule } from '@/modules/users';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, storageConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule.forRoot(loggerConfig),
    CoreModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
