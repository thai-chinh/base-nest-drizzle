export const STORAGE_CLIENT = 'STORAGE_CLIENT';

/**
 * Supported storage providers
 */
export type StorageProvider = 's3' | 'r2' | 'minio';

/**
 * Upload options
 */
export interface UploadOptions {
  /**
   * Folder/prefix in the bucket
   * @example 'avatars', 'documents/2024'
   */
  folder?: string;

  /**
   * Custom filename (without extension)
   * If not provided, a UUID will be generated
   */
  filename?: string;

  /**
   * Content type override
   */
  contentType?: string;

  /**
   * Make file publicly accessible
   * @default false
   */
  public?: boolean;

  /**
   * Custom metadata
   */
  metadata?: Record<string, string>;

  /**
   * Cache control header
   * @example 'max-age=31536000' (1 year)
   */
  cacheControl?: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  /**
   * Object key (path in bucket)
   */
  key: string;

  /**
   * Full URL to access the file
   */
  url: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Content type
   */
  contentType: string;

  /**
   * ETag from storage provider
   */
  etag?: string;
}

/**
 * Presigned URL options
 */
export interface PresignedUrlOptions {
  /**
   * URL expiration time in seconds
   * @default 3600 (1 hour)
   */
  expiresIn?: number;

  /**
   * For upload URLs: content type
   */
  contentType?: string;

  /**
   * For upload URLs: max file size
   */
  contentLength?: number;
}

/**
 * File info
 */
export interface FileInfo {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
  metadata?: Record<string, string>;
}
