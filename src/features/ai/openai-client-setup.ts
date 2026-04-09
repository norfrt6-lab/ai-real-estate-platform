/**
 * @module  ai
 * @feature openai-client-setup
 * @branch  feat/ai-openai-client-setup
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Environment validation schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  // TODO: add module-specific env vars
});

// Parse and validate – throws at startup if required vars are missing
export const env = envSchema.parse(process.env);

// ---------------------------------------------------------------------------
// Module configuration constants
// ---------------------------------------------------------------------------

export const openaiclientsetupConfig = {
  module:     'ai',
  feature:    'openai-client-setup',
  version:    '1.0.0',

  pagination: {
    defaultPage:  1,
    defaultLimit: 20,
    maxLimit:     100,
  },

  cache: {
    ttl:         60,     // seconds
    staleTime:   30_000, // ms (client-side)
    revalidate:  60,     // Next.js ISR revalidate seconds
  },

  rateLimit: {
    windowMs: 60_000, // 1 minute
    max:      100,    // requests per window
  },
} as const;

export type OpenaiClientSetupConfig = typeof openaiclientsetupConfig;

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export const featureFlags = {
  enableOpenaiClientSetup:        true,
  enableOpenaiClientSetupExport:  process.env.NODE_ENV === 'production',
  enableOpenaiClientSetupPreview: process.env.NODE_ENV !== 'production',
} as const;
