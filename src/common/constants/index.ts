export const APP_NAME = 'NestJS Boilerplate';

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Cache TTL (seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// Lock TTL (milliseconds)
export const LOCK_TTL = {
  SHORT: 5000, // 5 seconds
  MEDIUM: 30000, // 30 seconds
  LONG: 60000, // 1 minute
} as const;

// System Reset Time - Thời điểm reset hệ thống hàng ngày
// Sử dụng cho: scheduler aggregation, validator work-shift
export const SYSTEM_RESET_TIME = {
  HOUR: 0, // 00:00
  MINUTES_FROM_MIDNIGHT: 0, // 0 phút từ nửa đêm (00:00 = 0, 02:00 = 120)
} as const;

export * from './message-codes';
