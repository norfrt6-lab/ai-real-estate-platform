/**
 * @module  ai
 * @feature error-handling
 * @branch  feat/ai-error-handling
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'error-handling' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const errorhandlingSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type ErrorHandling = z.infer<typeof errorhandlingSchema>;

export interface ErrorHandlingOptions {
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
 * Validate and parse a raw object into a ErrorHandling.
 */
export function parseErrorHandling(raw: unknown): ErrorHandling {
  const result = errorhandlingSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid ErrorHandling data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a ErrorHandling for API responses (removes sensitive fields, etc.)
 */
export function formatErrorHandling(item: ErrorHandling): Omit<ErrorHandling, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a ErrorHandling.
 */
export function getErrorHandlingSlug(item: Pick<ErrorHandling, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateErrorHandlingId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('ErrorHandling ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const errorhandlingDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('ErrorHandling module loaded');
