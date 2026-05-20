import { registerAs } from '@nestjs/config';

/**
 * Storage Configuration
 *
 * Supports AWS S3, Cloudflare R2, and MinIO.
 * All are S3-compatible, so we use the same SDK.
 *
 * Environment variables:
 * - STORAGE_PROVIDER: 's3', 'r2', or 'minio' (default: 's3')
 *
 * For AWS S3:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET
 *
 * For Cloudflare R2:
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_R2_ACCESS_KEY_ID
 * - CLOUDFLARE_R2_SECRET_ACCESS_KEY
 * - CLOUDFLARE_R2_BUCKET
 * - CLOUDFLARE_R2_PUBLIC_URL (optional, for public access)
 *
 * For MinIO:
 * - MINIO_ENDPOINT (e.g., http://localhost:9000)
 * - MINIO_ACCESS_KEY_ID
 * - MINIO_SECRET_ACCESS_KEY
 * - MINIO_BUCKET
 * - MINIO_REGION (optional, default: 'us-east-1')
 * - MINIO_PUBLIC_URL (optional, for public access)
 */
export default registerAs('storage', () => {
  const provider = process.env.STORAGE_PROVIDER || 's3';

  // Common config
  const config = {
    provider,
    allowedMimeTypes:
      'image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm'.split(
        ',',
      ),
  };

  if (provider === 'r2') {
    return {
      ...config,
      r2: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        bucket: process.env.CLOUDFLARE_R2_BUCKET || 'nestjs-boilerplate',
        publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL, // Optional custom domain
        // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      },
    };
  }

  if (provider === 'minio') {
    return {
      ...config,
      minio: {
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
        secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
        bucket: process.env.MINIO_BUCKET || 'nestjs-boilerplate',
        region: process.env.MINIO_REGION || 'us-east-1',
        publicUrl: process.env.MINIO_PUBLIC_URL,
      },
    };
  }

  return {
    ...config,
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-southeast-1',
      bucket: process.env.AWS_S3_BUCKET || 'nestjs-boilerplate',
      // Optional: custom endpoint for S3-compatible services
      endpoint: process.env.AWS_S3_ENDPOINT,
    },
  };
});
