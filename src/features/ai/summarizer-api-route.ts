/**
 * @module  ai
 * @feature summarizer-api-route
 * @branch  feat/ai-summarizer-api-route
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const querySchema = z.object({
  page:    z.coerce.number().int().positive().default(1),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
  search:  z.string().optional(),
  sortBy:  z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createSchema = z.object({
  // TODO: define creation fields
  name: z.string().min(1).max(255),
});

export type SummarizerApiRouteQuery  = z.infer<typeof querySchema>;
export type CreateSummarizerApiRouteInput = z.infer<typeof createSchema>;

const log = logger.child({ route: '/ai/summarizer-api-route' });

// ---------------------------------------------------------------------------
// GET /api/ai/summarizer-api-route
// ---------------------------------------------------------------------------

async function handleGet(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized();

  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  log.info({ userId: session.user.id, query }, 'GET summarizer-api-route');

  // TODO: replace with real service/repository call
  const data: unknown[] = [];
  const total = 0;

  return NextResponse.json<ApiResponse<unknown[]>>({
    success: true,
    data,
    meta: {
      page:       query.page,
      limit:      query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/ai/summarizer-api-route
// ---------------------------------------------------------------------------

async function handlePost(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized();

  const body = await req.json();
  const input = createSchema.parse(body);

  log.info({ userId: session.user.id, input }, 'POST summarizer-api-route');

  // TODO: replace with real service call
  const created = { id: crypto.randomUUID(), ...input, createdAt: new Date() };

  return NextResponse.json<ApiResponse<typeof created>>(
    { success: true, data: created },
    { status: 201 },
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const GET  = withErrorHandler(handleGet);
export const POST = withErrorHandler(handlePost);
