/**
 * @module  ai
 * @feature usage-tracking
 * @branch  feat/ai-usage-tracking
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'usage-tracking' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const usagetrackingSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type UsageTracking = z.infer<typeof usagetrackingSchema>;

export interface UsageTrackingOptions {
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
 * Validate and parse a raw object into a UsageTracking.
 */
export function parseUsageTracking(raw: unknown): UsageTracking {
  const result = usagetrackingSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid UsageTracking data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a UsageTracking for API responses (removes sensitive fields, etc.)
 */
export function formatUsageTracking(item: UsageTracking): Omit<UsageTracking, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a UsageTracking.
 */
export function getUsageTrackingSlug(item: Pick<UsageTracking, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateUsageTrackingId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('UsageTracking ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const usagetrackingDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('UsageTracking module loaded');
