/**
 * Serialize data for caching in Redis
 * Handles BigInt conversion to string
 * @param data - Data to serialize
 * @returns JSON string
 */
export function serializeForCache(data: any): string {
  return JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
}

/**
 * Deserialize data from Redis cache
 * @param cached - Cached JSON string
 * @returns Parsed data
 */
export function deserializeFromCache(cached: string): any {
  return JSON.parse(cached);
}
