/**
 * @module  ai
 * @feature property-description-generator
 * @branch  feat/ai-property-description-generator
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'property-description-generator' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const propertydescriptiongeneratorSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type PropertyDescriptionGenerator = z.infer<typeof propertydescriptiongeneratorSchema>;

export interface PropertyDescriptionGeneratorOptions {
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
 * Validate and parse a raw object into a PropertyDescriptionGenerator.
 */
export function parsePropertyDescriptionGenerator(raw: unknown): PropertyDescriptionGenerator {
  const result = propertydescriptiongeneratorSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid PropertyDescriptionGenerator data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a PropertyDescriptionGenerator for API responses (removes sensitive fields, etc.)
 */
export function formatPropertyDescriptionGenerator(item: PropertyDescriptionGenerator): Omit<PropertyDescriptionGenerator, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a PropertyDescriptionGenerator.
 */
export function getPropertyDescriptionGeneratorSlug(item: Pick<PropertyDescriptionGenerator, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validatePropertyDescriptionGeneratorId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('PropertyDescriptionGenerator ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const propertydescriptiongeneratorDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('PropertyDescriptionGenerator module loaded');
