import { Module } from '@nestjs/common';
import { RedisModule, RedlockModule, RedlockService } from './redis';
import { QueueModule } from './queue';
import { DatabaseModule } from './database';
import { StorageModule } from './storage';

@Module({
  imports: [DatabaseModule, RedisModule, RedlockModule, QueueModule, StorageModule],
  providers: [RedlockService],
  exports: [
    DatabaseModule,
    RedisModule,
    RedlockModule,
    QueueModule,
    StorageModule,
    RedlockService,
  ],
})
export class CoreModule {}
