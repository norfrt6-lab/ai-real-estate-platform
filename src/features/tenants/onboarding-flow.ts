/**
 * @module  tenant
 * @feature onboarding-flow
 * @branch  feat/tenant-onboarding-flow
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'onboarding-flow' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const onboardingflowSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type OnboardingFlow = z.infer<typeof onboardingflowSchema>;

export interface OnboardingFlowOptions {
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
 * Validate and parse a raw object into a OnboardingFlow.
 */
export function parseOnboardingFlow(raw: unknown): OnboardingFlow {
  const result = onboardingflowSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid OnboardingFlow data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a OnboardingFlow for API responses (removes sensitive fields, etc.)
 */
export function formatOnboardingFlow(item: OnboardingFlow): Omit<OnboardingFlow, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a OnboardingFlow.
 */
export function getOnboardingFlowSlug(item: Pick<OnboardingFlow, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateOnboardingFlowId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('OnboardingFlow ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const onboardingflowDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('OnboardingFlow module loaded');
