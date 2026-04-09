/**
 * @module  ai
 * @feature prompt-templates
 * @branch  feat/ai-prompt-templates
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'prompt-templates' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const prompttemplatesSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type PromptTemplates = z.infer<typeof prompttemplatesSchema>;

export interface PromptTemplatesOptions {
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
 * Validate and parse a raw object into a PromptTemplates.
 */
export function parsePromptTemplates(raw: unknown): PromptTemplates {
  const result = prompttemplatesSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid PromptTemplates data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a PromptTemplates for API responses (removes sensitive fields, etc.)
 */
export function formatPromptTemplates(item: PromptTemplates): Omit<PromptTemplates, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a PromptTemplates.
 */
export function getPromptTemplatesSlug(item: Pick<PromptTemplates, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validatePromptTemplatesId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('PromptTemplates ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const prompttemplatesDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('PromptTemplates module loaded');
