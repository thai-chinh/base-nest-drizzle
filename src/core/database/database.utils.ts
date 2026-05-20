import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as appSchema from './schema/app.schema';
import { DrizzleDB } from './database.types';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export function getConnectionString(): string {
  return (
    process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`
  );
}

export function createDatabaseClient(
  connectionString: string,
  options?: {
    max?: number;
    idleTimeout?: number;
    connectTimeout?: number;
  },
): postgres.Sql {
  return postgres(connectionString, {
    max: options?.max ?? 10,
    idle_timeout: options?.idleTimeout ?? 20,
    connect_timeout: options?.connectTimeout ?? 10,
    onnotice: () => {},
  });
}

export function createDatabaseInstance(client: postgres.Sql): DrizzleDB {
  return drizzle(client, { schema: appSchema });
}
