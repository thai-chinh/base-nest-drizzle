import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 12;

let nanoidModule: { nanoid: (size?: number) => string } | null = null;
async function getNanoid(): Promise<(size?: number) => string> {
  if (!nanoidModule) {
    nanoidModule = await import('nanoid');
  }
  return nanoidModule.nanoid;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random string using nanoid
 * @param size - Length of the string (default: 21)
 */
export async function generateId(size = 21): Promise<string> {
  const nanoid = await getNanoid();
  return nanoid(size);
}

/**
 * Generate a short ID (useful for invite codes, etc.)
 */
export async function generateShortId(): Promise<string> {
  const nanoid = await getNanoid();
  return nanoid(8);
}

/**
 * Generate a secure random token
 * @param bytes - Number of bytes (default: 32)
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a URL-safe random string
 */
export function generateUrlSafeToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Hash a string using SHA-256
 */
export function hashSHA256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash a string using MD5 (not secure, use for checksums only)
 */
export function hashMD5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Create HMAC signature
 */
export function createHmac(
  data: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256',
): string {
  return crypto.createHmac(algorithm, secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmac(
  data: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256',
): boolean {
  const expectedSignature = createHmac(data, secret, algorithm);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Generate OTP code (numeric)
 * @param length - Length of OTP (default: 6)
 */
export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}
