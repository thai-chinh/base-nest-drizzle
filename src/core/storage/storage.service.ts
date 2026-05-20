import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { posix as pathPosix } from 'path';
import {
  StorageProvider,
  UploadOptions,
  UploadResult,
  PresignedUrlOptions,
  FileInfo,
} from './storage.constants';
import { generateId } from '@/common/utils';
import { ApiBadRequestException } from '@/common/exceptions/api.exception';
import { MESSAGE_CODES } from '@/common/constants/message-codes';

/**
 * Storage Service
 *
 * Unified interface for AWS S3, Cloudflare R2, and MinIO.
 * All use the same S3-compatible API.
 *
 * @example
 * // Upload file
 * const result = await storageService.upload(buffer, 'image.png', {
 *   folder: 'avatars',
 *   public: true,
 * });
 *
 * // Get presigned URL for direct upload
 * const { url, key } = await storageService.getPresignedUploadUrl('documents', {
 *   contentType: 'application/pdf',
 *   expiresIn: 3600,
 * });
 *
 * // Delete file
 * await storageService.delete(key);
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly provider: StorageProvider;
  private readonly publicUrl?: string;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    // Handle case when configService is undefined (e.g., during OpenAPI generation)
    if (!configService || !configService.get) {
      this.provider = 'minio';
      this.allowedMimeTypes = [];
      this.bucket = 'dummy-bucket';
      
      this.client = new S3Client({
        region: 'us-east-1',
        endpoint: 'http://localhost:9000',
        credentials: {
          accessKeyId: 'dummy-key',
          secretAccessKey: 'dummy-secret',
        },
        forcePathStyle: true,
      });

      this.logger.warn('StorageService initialized with dummy config (for OpenAPI generation)');
      return;
    }

    const storageConfig = this.configService.get('storage');
    this.provider = storageConfig.provider;
    this.allowedMimeTypes = storageConfig.allowedMimeTypes;

    if (this.provider === 'r2') {
      // Cloudflare R2
      const r2Config = storageConfig.r2;
      this.bucket = r2Config.bucket;
      this.publicUrl = r2Config.publicUrl;

      this.client = new S3Client({
        region: 'auto',
        endpoint: r2Config.endpoint,
        credentials: {
          accessKeyId: r2Config.accessKeyId,
          secretAccessKey: r2Config.secretAccessKey,
        },
      });

      this.logger.log('Storage initialized with Cloudflare R2');
    } else if (this.provider === 'minio') {
      const minioConfig = storageConfig.minio;
      this.bucket = minioConfig.bucket;
      this.publicUrl = minioConfig.publicUrl;

      this.client = new S3Client({
        region: minioConfig.region,
        endpoint: minioConfig.endpoint,
        credentials: {
          accessKeyId: minioConfig.accessKeyId,
          secretAccessKey: minioConfig.secretAccessKey,
        },
        forcePathStyle: true, // Required for MinIO
      });

      this.logger.log(
        `Storage initialized with MinIO (${minioConfig.endpoint})`,
      );
    } else {
      // AWS S3
      const s3Config = storageConfig.s3;
      this.bucket = s3Config.bucket;

      const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
        region: s3Config.region,
        credentials: {
          accessKeyId: s3Config.accessKeyId,
          secretAccessKey: s3Config.secretAccessKey,
        },
      };

      if (s3Config.endpoint) {
        clientConfig.endpoint = s3Config.endpoint;
        clientConfig.forcePathStyle = true;
      }

      this.client = new S3Client(clientConfig);

      this.logger.log(`Storage initialized with AWS S3 (${s3Config.region})`);
    }
  }

  /**
   * Upload a file to storage
   */
  async upload(
    data: Buffer | Readable,
    originalFilename: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const ext = this.getExtension(originalFilename);
    const filename = options.filename || (await generateId());
    const key = this.buildKey(filename, ext, options.folder);

    const contentType =
      options.contentType || this.getMimeType(originalFilename);

    if (!this.isAllowedMimeType(contentType)) {
      throw new ApiBadRequestException(
        MESSAGE_CODES.COMMON.FILE_TYPE_NOT_ALLOWED,
      );
    }

    if (data instanceof Readable) {
      return this.multipartUpload(data, key, contentType, options);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: options.cacheControl || 'max-age=31536000',
      Metadata: options.metadata,
      ACL: options.public ? 'public-read' : undefined,
    });

    const response = await this.client.send(command);

    const url = this.getFileUrl(key);

    this.logger.log(`Uploaded file: ${key} (${data.length} bytes)`);

    return {
      key,
      url,
      size: data.length,
      contentType,
      etag: response.ETag,
    };
  }

  private async multipartUpload(
    stream: Readable,
    key: string,
    contentType: string,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
        CacheControl: options.cacheControl || 'max-age=31536000',
        Metadata: options.metadata,
        ACL: options.public ? 'public-read' : undefined,
      },
    });

    const response = await upload.done();

    const url = this.getFileUrl(key);

    this.logger.log(`Uploaded file (multipart): ${key}`);

    return {
      key,
      url,
      size: 0,
      contentType,
      etag: response.ETag,
    };
  }

  async getPresignedDownloadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  async getPresignedUploadUrl(
    folder: string,
    options: PresignedUrlOptions & { filename?: string; ext?: string } = {},
  ): Promise<{ url: string; key: string }> {
    const filename = options.filename || (await generateId());
    const ext = options.ext || 'bin';
    const key = this.buildKey(filename, ext, folder);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600,
    });

    return { url, key };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);

    this.logger.log(`Deleted file: ${key}`);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async getFileInfo(key: string): Promise<FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error: unknown) {
      if ((error as { name?: string }).name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const info = await this.getFileInfo(key);
    return info !== null;
  }

  async list(
    prefix: string,
    options: { maxKeys?: number; continuationToken?: string } = {},
  ): Promise<{ files: FileInfo[]; nextToken?: string }> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: options.maxKeys || 1000,
      ContinuationToken: options.continuationToken,
    });

    const response = await this.client.send(command);

    const files: FileInfo[] =
      response.Contents?.map((item) => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified,
        etag: item.ETag,
      })) || [];

    return {
      files,
      nextToken: response.NextContinuationToken,
    };
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destKey,
    });

    await this.client.send(command);

    this.logger.log(`Copied file: ${sourceKey} -> ${destKey}`);
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);

    this.logger.log(`Moved file: ${sourceKey} -> ${destKey}`);
  }

  getFileUrl(key: string): string {
    if (this.provider === 'minio') {
      if (this.publicUrl) {
        // For MinIO with publicUrl, include bucket name in the path
        const baseUrl = this.publicUrl.endsWith('/')
          ? this.publicUrl.slice(0, -1)
          : this.publicUrl;
        return `${baseUrl}/${this.bucket}/${key}`;
      }
      
      // Handle case when configService is undefined
      if (!this.configService || !this.configService.get) {
        return `http://localhost:9000/${this.bucket}/${key}`;
      }
      
      const minioConfig = this.configService.get('storage.minio');
      const endpoint = minioConfig.endpoint;
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      return `${baseUrl}/${this.bucket}/${key}`;
    }

    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    if (this.provider === 'r2') {
      return `https://${this.bucket}.r2.dev/${key}`;
    }

    // Handle case when configService is undefined
    if (!this.configService || !this.configService.get) {
      return `https://${this.bucket}.s3.us-east-1.amazonaws.com/${key}`;
    }
    
    const region = this.configService.get('storage.s3.region');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Check connection to storage provider
   */
  async checkConnection(): Promise<void> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: 'health-check-non-existent-file-' + Date.now(),
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      // If we get a NotFound error, it means we connected to the bucket
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return;
      }
      throw error;
    }
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  /**
   * Build S3 object key.
   * Pattern: {folder?}/{filename}.{ext}
   * Example: avatars/abc123.jpg
   */
  private buildKey(filename: string, ext: string, folder?: string): string {
    const sanitizedFolder = folder
      ? folder.replace(/^\/+/, '').replace(/\/+$/, '')
      : '';

    const segments = sanitizedFolder
      ? [sanitizedFolder, ext ? `${filename}.${ext}` : filename]
      : [ext ? `${filename}.${ext}` : filename];

    return pathPosix.join(...segments);
  }

  private getMimeType(filename: string): string {
    const ext = this.getExtension(filename);
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain',
      json: 'application/json',
      zip: 'application/zip',
      mp4: 'video/mp4',
      mpeg: 'video/mpeg',
      mpg: 'video/mpeg',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      webm: 'video/webm',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private isAllowedMimeType(mimeType: string): boolean {
    if (this.allowedMimeTypes.length === 0) {
      return true;
    }

    return this.allowedMimeTypes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return mimeType === allowed;
    });
  }
}
