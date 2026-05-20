import { Injectable, Inject } from '@nestjs/common';
import Redlock, { Lock } from 'redlock';

export const REDLOCK_CLIENT = 'REDLOCK_CLIENT';

@Injectable()
export class RedlockService {
  constructor(@Inject(REDLOCK_CLIENT) private readonly redlock: Redlock) {}

  /**
   * Acquire a distributed lock on a resource
   * @param resource - The resource key to lock (e.g., 'locks:user:123')
   * @param ttl - Time to live in milliseconds (default: 5000ms)
   * @returns The lock object
   */
  async acquire(resource: string, ttl = 5000): Promise<Lock> {
    const lock = await this.redlock.acquire([resource], ttl);
    return lock;
  }

  /**
   * Release a lock
   */
  async release(lock: Lock): Promise<void> {
    await lock.release();
  }

  /**
   * Extend a lock's TTL
   */
  async extend(lock: Lock, ttl: number): Promise<Lock> {
    return await lock.extend(ttl);
  }

  /**
   * Execute a function with automatic lock management
   */
  async using<T>(
    resource: string,
    ttl: number,
    fn: (signal: { aborted: boolean }) => Promise<T>,
  ): Promise<T> {
    return await this.redlock.using([resource], ttl, fn);
  }

  /**
   * Execute with lock - simplified API
   */
  async withLock<T>(
    resource: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const lock = await this.acquire(resource, ttl);
    try {
      return await fn();
    } finally {
      await this.release(lock);
    }
  }
}
