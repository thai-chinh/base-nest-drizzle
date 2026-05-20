import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as appSchema from './schema/app.schema';

export type DrizzleDB = PostgresJsDatabase<typeof appSchema>;

export type Transaction = Parameters<
  Parameters<DrizzleDB['transaction']>[0]
>[0];
