import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';
import { REDIS_CLIENT } from './redis.module';
import { RedlockService, REDLOCK_CLIENT } from './redlock.service';

@Global()
@Module({
  providers: [
    {
      provide: REDLOCK_CLIENT,
      useFactory: (redis: Redis) => {
        return new Redlock([redis], {
          // The expected clock drift; for more details see:
          // http://redis.io/topics/distlock
          driftFactor: 0.01,

          // The max number of times Redlock will attempt to lock a resource
          retryCount: 10,

          // The time in ms between attempts
          retryDelay: 200,

          // The max time in ms randomly added to retries
          retryJitter: 200,

          // The minimum remaining time on a lock before an extension is automatically
          // attempted with the `using` API.
          automaticExtensionThreshold: 500,
        });
      },
      inject: [REDIS_CLIENT],
    },
    RedlockService,
  ],
  exports: [REDLOCK_CLIENT, RedlockService],
})
export class RedlockModule implements OnModuleDestroy {
  constructor(@Inject(REDLOCK_CLIENT) private readonly redlock: Redlock) {}

  async onModuleDestroy() {
    await this.redlock.quit();
  }
}
