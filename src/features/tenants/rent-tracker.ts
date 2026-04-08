/**
 * @module  tenant
 * @feature rent-tracker
 * @branch  feat/tenant-rent-tracker
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'rent-tracker' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const renttrackerSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type RentTracker = z.infer<typeof renttrackerSchema>;

export interface RentTrackerOptions {
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
 * Validate and parse a raw object into a RentTracker.
 */
export function parseRentTracker(raw: unknown): RentTracker {
  const result = renttrackerSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid RentTracker data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a RentTracker for API responses (removes sensitive fields, etc.)
 */
export function formatRentTracker(item: RentTracker): Omit<RentTracker, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a RentTracker.
 */
export function getRentTrackerSlug(item: Pick<RentTracker, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateRentTrackerId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('RentTracker ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const renttrackerDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('RentTracker module loaded');
