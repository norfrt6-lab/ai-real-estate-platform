/**
 * @module  ai
 * @feature response-streaming
 * @branch  feat/ai-response-streaming
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'response-streaming' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const responsestreamingSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type ResponseStreaming = z.infer<typeof responsestreamingSchema>;

export interface ResponseStreamingOptions {
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
 * Validate and parse a raw object into a ResponseStreaming.
 */
export function parseResponseStreaming(raw: unknown): ResponseStreaming {
  const result = responsestreamingSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid ResponseStreaming data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a ResponseStreaming for API responses (removes sensitive fields, etc.)
 */
export function formatResponseStreaming(item: ResponseStreaming): Omit<ResponseStreaming, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a ResponseStreaming.
 */
export function getResponseStreamingSlug(item: Pick<ResponseStreaming, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateResponseStreamingId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('ResponseStreaming ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const responsestreamingDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('ResponseStreaming module loaded');
