/**
 * @module  maintenance
 * @feature list-api
 * @branch  feat/maintenance-list-api
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

export type ListApiQuery  = z.infer<typeof querySchema>;
export type CreateListApiInput = z.infer<typeof createSchema>;

const log = logger.child({ route: '/maintenance/list-api' });

// ---------------------------------------------------------------------------
// GET /api/maintenance/list-api
// ---------------------------------------------------------------------------

async function handleGet(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized();

  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  log.info({ userId: session.user.id, query }, 'GET list-api');

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
// POST /api/maintenance/list-api
// ---------------------------------------------------------------------------

async function handlePost(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized();

  const body = await req.json();
  const input = createSchema.parse(body);

  log.info({ userId: session.user.id, input }, 'POST list-api');

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
