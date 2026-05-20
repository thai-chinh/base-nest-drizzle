export function toBigIntId(
  id: string | bigint | undefined | null,
  fallback?: string | bigint,
): bigint | undefined {
  if (id === undefined || id === null) {
    if (fallback !== undefined) {
      return typeof fallback === 'string' ? BigInt(fallback) : fallback;
    }
    return undefined;
  }

  return typeof id === 'string' ? BigInt(id) : id;
}

export function extractUserId(user: {
  id?: string | bigint;
  sub?: string;
}): bigint | undefined {
  return toBigIntId(user.id, user.sub);
}
