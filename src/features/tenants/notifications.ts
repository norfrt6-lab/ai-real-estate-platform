/**
 * @module  tenant
 * @feature notifications
 * @branch  feat/tenant-notifications
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'tenant', feature: 'notifications' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const notificationsSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type Notifications = z.infer<typeof notificationsSchema>;

export interface NotificationsOptions {
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
 * Validate and parse a raw object into a Notifications.
 */
export function parseNotifications(raw: unknown): Notifications {
  const result = notificationsSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid Notifications data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a Notifications for API responses (removes sensitive fields, etc.)
 */
export function formatNotifications(item: Notifications): Omit<Notifications, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a Notifications.
 */
export function getNotificationsSlug(item: Pick<Notifications, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateNotificationsId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('Notifications ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const notificationsDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('Notifications module loaded');
