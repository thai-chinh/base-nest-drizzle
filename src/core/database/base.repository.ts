import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from './database.utils';
import { DrizzleDB, Transaction } from './database.types';

/**
 * Base repository for all feature repositories.
 *
 * Provides a single DrizzleDB instance via DI and a getDb() helper
 * that transparently switches to a transaction when one is provided.
 *
 * Usage:
 *   @Injectable()
 *   export class UsersRepository extends BaseRepository {
 *     constructor(@Inject(DATABASE_CONNECTION) db: DrizzleDB) {
 *       super(db);
 *     }
 *   }
 */
export abstract class BaseRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: DrizzleDB,
  ) {}

  protected getDb(tx?: Transaction): DrizzleDB | Transaction {
    return tx ?? this.db;
  }
}
