import { ApiResponse } from '../types/api.js';

// Success response helper
export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta']
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

// Error response helper
export function errorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

// Pagination helper
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiResponse['meta'] {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}

// Common error responses
export const CommonErrors = {
  VALIDATION_ERROR: (details?: any) =>
    errorResponse('VALIDATION_ERROR', 'Invalid request data', details),
  
  NOT_FOUND: (resource = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`),
  
  UNAUTHORIZED: () =>
    errorResponse('UNAUTHORIZED', 'Authentication required'),
  
  FORBIDDEN: () =>
    errorResponse('FORBIDDEN', 'Insufficient permissions'),
  
  CONFLICT: (message = 'Resource already exists') =>
    errorResponse('CONFLICT', message),
  
  INTERNAL_ERROR: (details?: any) =>
    errorResponse('INTERNAL_ERROR', 'Internal server error', details),
  
  BAD_REQUEST: (message = 'Bad request') =>
    errorResponse('BAD_REQUEST', message),
} as const;