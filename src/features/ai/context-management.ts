/**
 * @module  ai
 * @feature context-management
 * @branch  feat/ai-context-management
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'context-management' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const contextmanagementSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type ContextManagement = z.infer<typeof contextmanagementSchema>;

export interface ContextManagementOptions {
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
 * Validate and parse a raw object into a ContextManagement.
 */
export function parseContextManagement(raw: unknown): ContextManagement {
  const result = contextmanagementSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid ContextManagement data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a ContextManagement for API responses (removes sensitive fields, etc.)
 */
export function formatContextManagement(item: ContextManagement): Omit<ContextManagement, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a ContextManagement.
 */
export function getContextManagementSlug(item: Pick<ContextManagement, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateContextManagementId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('ContextManagement ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const contextmanagementDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('ContextManagement module loaded');
