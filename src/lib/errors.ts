export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError('UNAUTHORIZED', message, 401);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError('FORBIDDEN', message, 403);
  }
  static notFound(resource = 'Resource') {
    return new ApiError('NOT_FOUND', `${resource} not found`, 404);
  }
  static badRequest(message: string, details?: unknown) {
    return new ApiError('BAD_REQUEST', message, 400, details);
  }
  static internal(message = 'Internal server error') {
    return new ApiError('INTERNAL_ERROR', message, 500);
  }
}
