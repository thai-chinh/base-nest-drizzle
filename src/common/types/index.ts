/**
 * Generic API response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code?: string; // Message code for frontend translation
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Generic error response type with message code
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * Paginated data type
 */
export interface PaginatedData<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type SortOrder = 'asc' | 'desc';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
