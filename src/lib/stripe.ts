import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Stripe singleton client
//
// Re-uses a single instance across hot-reloads in development (Next.js) and
// across the serverless function lifecycle in production.
//
// Required env var:
//   STRIPE_SECRET_KEY — your Stripe secret key (sk_live_... or sk_test_...)
//
// Optional env vars:
//   STRIPE_WEBHOOK_SECRET — used to verify incoming webhook signatures
// ---------------------------------------------------------------------------

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
    typescript: true,
    // Telemetry is disabled for privacy in production environments
    telemetry: false,
    // Reasonable timeout for payment operations
    timeout: 30_000,
    maxNetworkRetries: 2,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe;
}

// ---------------------------------------------------------------------------
// Helper: verify Stripe webhook signature
//
// Usage in a webhook route handler:
//
//   const event = verifyStripeWebhook(await request.text(), request.headers.get('stripe-signature') ?? '');
//
// ---------------------------------------------------------------------------
export function verifyStripeWebhook(
  payload: string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set. Cannot verify webhook signature.',
    );
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// ---------------------------------------------------------------------------
// Re-export common Stripe types for convenience
// ---------------------------------------------------------------------------
export type { Stripe };
