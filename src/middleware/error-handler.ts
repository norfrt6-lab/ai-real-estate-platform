import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';
import { ApiResponse } from '@/types/api';

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: { code: err.code, message: err.message, details: err.details } },
          { status: err.statusCode },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.flatten() } },
          { status: 422 },
        );
      }
      logger.error(err, 'Unhandled route error');
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 },
      );
    }
  };
}
