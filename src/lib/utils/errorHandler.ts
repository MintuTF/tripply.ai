import { logger } from '../logger';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle known application errors
  if (error instanceof AppError) {
    logger.error('Application error', error, {
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    });

    return {
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      timestamp,
    };
  }

  // Handle unknown errors
  logger.error('Unknown error', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    error: 'InternalServerError',
    message: isDevelopment
      ? error instanceof Error
        ? error.message
        : 'An unexpected error occurred'
      : 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    timestamp,
  };
}

/**
 * Safe error handler for async route handlers
 */
export function asyncHandler(
  fn: (req: Request, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (error) {
      const errorResponse = formatErrorResponse(error);
      return new Response(JSON.stringify(errorResponse), {
        status: errorResponse.statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
