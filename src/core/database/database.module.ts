import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DATABASE_CONNECTION,
  createDatabaseClient,
  createDatabaseInstance,
} from './database.utils';
import { DrizzleDB } from './database.types';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService): DrizzleDB => {
        const logger = new Logger('DatabaseModule');
        const connectionString = configService.get<string>('database.url');

        if (!connectionString) {
          throw new Error('DATABASE_URL is not configured');
        }

        logger.log('Connecting to database...');
        const client = createDatabaseClient(connectionString);
        const db = createDatabaseInstance(client);
        logger.log('Database connected successfully');

        return db;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
