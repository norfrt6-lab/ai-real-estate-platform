import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// OpenAI singleton client
//
// Re-uses a single instance across hot-reloads in development (Next.js) and
// across the serverless function lifecycle in production.
//
// Required env var:
//   OPENAI_API_KEY — your OpenAI secret key (sk-...)
//
// Optional env vars:
//   OPENAI_ORG_ID      — your OpenAI organisation ID (org-...)
//   OPENAI_PROJECT_ID  — pin requests to a specific project
//   OPENAI_BASE_URL    — override the API base URL (e.g. for proxies)
// ---------------------------------------------------------------------------

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID ?? undefined,
    project: process.env.OPENAI_PROJECT_ID ?? undefined,
    baseURL: process.env.OPENAI_BASE_URL ?? undefined,
    // Reasonable defaults for a production service
    maxRetries: 2,
    timeout: 60_000, // 60 s — streaming responses can take a while
  });

if (process.env.NODE_ENV !== 'production') {
  globalForOpenAI.openai = openai;
}
