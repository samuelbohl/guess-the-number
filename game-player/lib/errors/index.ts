import { isDevelopment, isProduction } from '@/lib/config';


export enum ErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly id: string;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.id = generateErrorId();
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.UNAUTHENTICATED, 401);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, ErrorCode.DATABASE_ERROR, 500);
  }
}

function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `err_${timestamp}_${random}`;
}

export function logError(error: Error | AppError, context?: Record<string, unknown>): void {
  const errorInfo = {
    message: error.message,
    stack: isDevelopment() ? error.stack : undefined,
    context,
    ...(error instanceof AppError && {
      id: error.id,
      code: error.code,
      statusCode: error.statusCode,
    }),
  };

  if (isProduction()) {
    console.error('Error:', JSON.stringify(errorInfo));
  } else {
    console.error('Error:', errorInfo);
  }
}

export function formatErrorResponse(error: Error | AppError): {
  error: {
    message: string;
    code: string;
    id: string;
  };
} {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        id: error.id,
      },
    };
  }

  return {
    error: {
      message: isDevelopment() ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      id: generateErrorId(),
    },
  };
}