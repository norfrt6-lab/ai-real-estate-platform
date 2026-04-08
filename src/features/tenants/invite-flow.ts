/**
 * @module  tenant
 * @feature invite-flow
 * @branch  feat/tenant-invite-flow
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'invite-flow' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const inviteflowSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type InviteFlow = z.infer<typeof inviteflowSchema>;

export interface InviteFlowOptions {
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
 * Validate and parse a raw object into a InviteFlow.
 */
export function parseInviteFlow(raw: unknown): InviteFlow {
  const result = inviteflowSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid InviteFlow data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a InviteFlow for API responses (removes sensitive fields, etc.)
 */
export function formatInviteFlow(item: InviteFlow): Omit<InviteFlow, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a InviteFlow.
 */
export function getInviteFlowSlug(item: Pick<InviteFlow, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateInviteFlowId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('InviteFlow ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const inviteflowDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('InviteFlow module loaded');
