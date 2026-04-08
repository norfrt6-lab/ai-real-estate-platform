/**
 * @module  tenant
 * @feature payment-history
 * @branch  feat/tenant-payment-history
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'payment-history' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const paymenthistorySchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type PaymentHistory = z.infer<typeof paymenthistorySchema>;

export interface PaymentHistoryOptions {
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
 * Validate and parse a raw object into a PaymentHistory.
 */
export function parsePaymentHistory(raw: unknown): PaymentHistory {
  const result = paymenthistorySchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid PaymentHistory data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a PaymentHistory for API responses (removes sensitive fields, etc.)
 */
export function formatPaymentHistory(item: PaymentHistory): Omit<PaymentHistory, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a PaymentHistory.
 */
export function getPaymentHistorySlug(item: Pick<PaymentHistory, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validatePaymentHistoryId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('PaymentHistory ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const paymenthistoryDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('PaymentHistory module loaded');
