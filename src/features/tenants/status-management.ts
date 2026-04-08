/**
 * @module  tenant
 * @feature status-management
 * @branch  feat/tenant-status-management
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'status-management' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const statusmanagementSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type StatusManagement = z.infer<typeof statusmanagementSchema>;

export interface StatusManagementOptions {
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
 * Validate and parse a raw object into a StatusManagement.
 */
export function parseStatusManagement(raw: unknown): StatusManagement {
  const result = statusmanagementSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid StatusManagement data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a StatusManagement for API responses (removes sensitive fields, etc.)
 */
export function formatStatusManagement(item: StatusManagement): Omit<StatusManagement, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a StatusManagement.
 */
export function getStatusManagementSlug(item: Pick<StatusManagement, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateStatusManagementId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('StatusManagement ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const statusmanagementDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('StatusManagement module loaded');
