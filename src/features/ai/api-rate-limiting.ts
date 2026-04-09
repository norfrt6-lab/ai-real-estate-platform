/**
 * @module  ai
 * @feature api-rate-limiting
 * @branch  feat/ai-api-rate-limiting
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'api-rate-limiting' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const apiratelimitingSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type ApiRateLimiting = z.infer<typeof apiratelimitingSchema>;

export interface ApiRateLimitingOptions {
  page?:      number;
  limit?:     number;
  search?:    string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Validate and parse a raw object into a ApiRateLimiting.
 */
export function parseApiRateLimiting(raw: unknown): ApiRateLimiting {
  const result = apiratelimitingSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid ApiRateLimiting data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a ApiRateLimiting for API responses (removes sensitive fields, etc.)
 */
export function formatApiRateLimiting(item: ApiRateLimiting): Omit<ApiRateLimiting, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a ApiRateLimiting.
 */
export function getApiRateLimitingSlug(item: Pick<ApiRateLimiting, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateApiRateLimitingId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('ApiRateLimiting ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const apiratelimitingDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('ApiRateLimiting module loaded');
