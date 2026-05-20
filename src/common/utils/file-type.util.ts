import { File } from '@nest-lab/fastify-multer';
import { ApiBadRequestException } from '@/common/exceptions/api.exception';

/**
 * Validates and determines the file type (image or video) from a file upload.
 * Returns fileType and buffer, throws if unsupported.
 */
export function validateAndGetFileType(file: File): {
  fileType: 'image' | 'video';
  buffer: Buffer;
} {
  if (!file || !file.buffer) {
    throw new ApiBadRequestException('COMMON_NO_FILE_PROVIDED');
  }

  const mimeType = file.mimetype || '';

  if (mimeType.startsWith('image/')) {
    return { fileType: 'image', buffer: file.buffer };
  }

  if (mimeType.startsWith('video/')) {
    return { fileType: 'video', buffer: file.buffer };
  }

  // Fallback to extension
  const fileName = file.originalname || '';
  if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
    return { fileType: 'image', buffer: file.buffer };
  }
  if (/\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)) {
    return { fileType: 'video', buffer: file.buffer };
  }

  throw new ApiBadRequestException('COMMON_FILE_TYPE_NOT_ALLOWED');
}
