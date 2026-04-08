/**
 * @module  tenant
 * @feature document-upload
 * @branch  feat/tenant-document-upload
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'document-upload' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const documentuploadSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type DocumentUpload = z.infer<typeof documentuploadSchema>;

export interface DocumentUploadOptions {
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
 * Validate and parse a raw object into a DocumentUpload.
 */
export function parseDocumentUpload(raw: unknown): DocumentUpload {
  const result = documentuploadSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid DocumentUpload data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a DocumentUpload for API responses (removes sensitive fields, etc.)
 */
export function formatDocumentUpload(item: DocumentUpload): Omit<DocumentUpload, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a DocumentUpload.
 */
export function getDocumentUploadSlug(item: Pick<DocumentUpload, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateDocumentUploadId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('DocumentUpload ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const documentuploadDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('DocumentUpload module loaded');
