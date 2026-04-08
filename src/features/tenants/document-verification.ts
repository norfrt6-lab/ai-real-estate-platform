/**
 * @module  tenant
 * @feature document-verification
 * @branch  feat/tenant-document-verification
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'document-verification' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const documentverificationSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type DocumentVerification = z.infer<typeof documentverificationSchema>;

export interface DocumentVerificationOptions {
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
 * Validate and parse a raw object into a DocumentVerification.
 */
export function parseDocumentVerification(raw: unknown): DocumentVerification {
  const result = documentverificationSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid DocumentVerification data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a DocumentVerification for API responses (removes sensitive fields, etc.)
 */
export function formatDocumentVerification(item: DocumentVerification): Omit<DocumentVerification, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a DocumentVerification.
 */
export function getDocumentVerificationSlug(item: Pick<DocumentVerification, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateDocumentVerificationId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('DocumentVerification ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const documentverificationDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('DocumentVerification module loaded');
