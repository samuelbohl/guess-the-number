export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION = 'VALIDATION_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

export class NotFoundError extends Error {
  public readonly code = ErrorCode.NOT_FOUND
}

export class ForbiddenError extends Error {
  public readonly code = ErrorCode.FORBIDDEN
}

export class BadRequestError extends Error {
  public readonly code = ErrorCode.BAD_REQUEST
}