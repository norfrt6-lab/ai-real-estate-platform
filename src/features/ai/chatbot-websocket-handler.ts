/**
 * @module  ai
 * @feature chatbot-websocket-handler
 * @branch  feat/ai-chatbot-websocket-handler
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { ID } from '@/types/common';

const log = logger.child({ module: 'ai', feature: 'chatbot-websocket-handler' });

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const chatbotwebsockethandlerSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export type ChatbotWebsocketHandler = z.infer<typeof chatbotwebsockethandlerSchema>;

export interface ChatbotWebsocketHandlerOptions {
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
 * Validate and parse a raw object into a ChatbotWebsocketHandler.
 */
export function parseChatbotWebsocketHandler(raw: unknown): ChatbotWebsocketHandler {
  const result = chatbotwebsockethandlerSchema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest('Invalid ChatbotWebsocketHandler data', result.error.flatten());
  }
  return result.data;
}

/**
 * Format a ChatbotWebsocketHandler for API responses (removes sensitive fields, etc.)
 */
export function formatChatbotWebsocketHandler(item: ChatbotWebsocketHandler): Omit<ChatbotWebsocketHandler, never> {
  return { ...item };
}

/**
 * Build a URL-safe slug/identifier from a ChatbotWebsocketHandler.
 */
export function getChatbotWebsocketHandlerSlug(item: Pick<ChatbotWebsocketHandler, 'id'>): string {
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validateChatbotWebsocketHandlerId(id: unknown): asserts id is ID {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw ApiError.badRequest('ChatbotWebsocketHandler ID must be a non-empty string');
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const chatbotwebsockethandlerDefaults = {
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
};

log.debug('ChatbotWebsocketHandler module loaded');
