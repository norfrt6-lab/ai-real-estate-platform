/**
 * @module  tenant
 * @feature ai-screening
 * @branch  feat/tenant-ai-screening
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'ai-screening' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const aiscreeningSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type AiScreening = z.infer<typeof aiscreeningSchema>;

export interface AiScreeningOptions {
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
 * Validate and parse a raw object into a AiScreening.
 */
export function parseAiScreening(raw: unknown): AiScreening {
  const result = aiscreeningSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid AiScreening data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a AiScreening for API responses (removes sensitive fields, etc.)
 */
export function formatAiScreening(item: AiScreening): Omit<AiScreening, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a AiScreening.
 */
export function getAiScreeningSlug(item: Pick<AiScreening, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateAiScreeningId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('AiScreening ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const aiscreeningDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('AiScreening module loaded');
