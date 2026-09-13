export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(statusCode: number, errorCode: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errorCode = "BAD_REQUEST", details?: unknown) {
    return new ApiError(400, errorCode, message, details);
  }
  static unauthorized(message = "Unauthorized", errorCode = "UNAUTHORIZED") {
    return new ApiError(401, errorCode, message);
  }
  static forbidden(message = "Forbidden", errorCode = "FORBIDDEN") {
    return new ApiError(403, errorCode, message);
  }
  static notFound(message = "Resource not found", errorCode = "NOT_FOUND") {
    return new ApiError(404, errorCode, message);
  }
  static conflict(message: string, errorCode = "CONFLICT") {
    return new ApiError(409, errorCode, message);
  }
  static internal(message = "Something went wrong", errorCode = "INTERNAL_ERROR") {
    return new ApiError(500, errorCode, message);
  }
}
