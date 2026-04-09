import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// ---------------------------------------------------------------------------
// ApiResponse wrapper
// ---------------------------------------------------------------------------
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function ok<T>(data: T, meta?: ApiResponse<T>['meta'], status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) } satisfies ApiResponse<T>,
    { status },
  );
}

function err(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse<never>,
    { status },
  );
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const CreatePaymentSchema = z.object({
  leaseId: z
    .string({ required_error: 'Lease ID is required.' })
    .min(1, 'Lease ID cannot be empty.'),

  tenantId: z
    .string({ required_error: 'Tenant ID is required.' })
    .min(1, 'Tenant ID cannot be empty.'),

  propertyId: z
    .string({ required_error: 'Property ID is required.' })
    .min(1, 'Property ID cannot be empty.'),

  amount: z
    .number({ required_error: 'Amount is required.' })
    .positive('Amount must be a positive number.')
    .max(10_000_000, 'Amount exceeds maximum allowed value.'),

  type: z.enum(
    ['RENT', 'SECURITY_DEPOSIT', 'LATE_FEE', 'MAINTENANCE_COST', 'OTHER'],
    { required_error: 'Payment type is required.' },
  ),

  dueDate: z.coerce.date({
    required_error: 'Due date is required.',
    invalid_type_error: 'Due date must be a valid ISO date string.',
  }),

  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters.')
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be at most 1000 characters.')
    .optional()
    .nullable(),

  // If true, immediately create a Stripe PaymentIntent so the tenant can pay
  createPaymentIntent: z.boolean().default(false),

  // Optional: Stripe customer ID if the tenant already has one
  stripeCustomerId: z.string().optional().nullable(),

  // Currency (defaults to USD)
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO code (e.g. "usd").')
    .toLowerCase()
    .default('usd'),
});

type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------
const LANDLORD_ROLES = ['SUPER_ADMIN', 'LANDLORD', 'AGENT'] as const;

function isLandlordRole(role: string): boolean {
  return (LANDLORD_ROLES as readonly string[]).includes(role);
}

// ---------------------------------------------------------------------------
// GET /api/payments
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    // ── Query params ─────────────────────────────────────────────────────────
    const { searchParams } = request.nextUrl;

    const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)));
    const search   = searchParams.get('search')?.trim()  ?? '';
    const status   = searchParams.get('status')?.trim()  ?? '';
    const type     = searchParams.get('type')?.trim()    ?? '';
    const tenantId = searchParams.get('tenantId')?.trim() ?? '';
    const propertyId = searchParams.get('propertyId')?.trim() ?? '';
    const fromDate = searchParams.get('fromDate')?.trim() ?? '';
    const toDate   = searchParams.get('toDate')?.trim()   ?? '';
    const sortBy   = searchParams.get('sortBy')   ?? 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    // ── Build where clause ───────────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    // Role-based scoping
    if (session.user.role === 'TENANT') {
      // Tenants see only their own payments
      where.tenantId = session.user.id;
    } else if (session.user.role === 'LANDLORD') {
      // Landlords see payments for their properties only
      where.property = { ownerId: session.user.id };
    }
    // SUPER_ADMIN and AGENT see all

    // Free-text search across tenant name/email or property title
    if (search) {
      where.OR = [
        { tenant: { name:  { contains: search, mode: 'insensitive' } } },
        { tenant: { email: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { stripePaymentIntentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    const validStatuses = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    // Type filter
    const validTypes = ['RENT', 'SECURITY_DEPOSIT', 'LATE_FEE', 'MAINTENANCE_COST', 'OTHER'];
    if (type && validTypes.includes(type)) {
      where.type = type;
    }

    // Tenant filter (admin / landlord use-case)
    if (tenantId && session.user.role !== 'TENANT') {
      where.tenantId = tenantId;
    }

    // Property filter
    if (propertyId) {
      where.propertyId = propertyId;
    }

    // Date range on dueDate
    if (fromDate || toDate) {
      where.dueDate = {
        ...(fromDate ? { gte: new Date(fromDate) } : {}),
        ...(toDate   ? { lte: new Date(toDate)   } : {}),
      };
    }

    // Whitelist sort fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'paidAt', 'amount', 'status'];
    const orderByField     = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // ── Execute queries ──────────────────────────────────────────────────────
    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { [orderByField]: orderByDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id:                     true,
          amount:                 true,
          currency:               true,
          status:                 true,
          type:                   true,
          dueDate:                true,
          paidAt:                 true,
          description:            true,
          notes:                  true,
          stripePaymentIntentId:  true,
          stripeClientSecret:     true,
          createdAt:              true,
          updatedAt:              true,
          tenant: {
            select: { id: true, name: true, email: true, image: true, phone: true },
          },
          property: {
            select: {
              id:      true,
              title:   true,
              address: true,
              city:    true,
              state:   true,
              type:    true,
            },
          },
          lease: {
            select: {
              id:         true,
              status:     true,
              startDate:  true,
              endDate:    true,
              rentAmount: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return ok(payments, { page, pageSize, total, totalPages });
  } catch (error) {
    console.error('[GET /api/payments]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    if (!isLandlordRole(session.user.role)) {
      return err('Forbidden. Only landlords, agents, and admins can record payments.', 403);
    }

    // ── Parse & validate body ────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON payload.', 400);
    }

    const parsed = CreatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return err(firstError?.message ?? 'Validation failed.', 422);
    }

    const data: CreatePaymentInput = parsed.data;

    // ── Verify the lease exists and belongs to the given tenant + property ───
    const lease = await prisma.lease.findFirst({
      where: {
        id:         data.leaseId,
        tenantId:   data.tenantId,
        propertyId: data.propertyId,
      },
      select: {
        id:         true,
        status:     true,
        rentAmount: true,
        property: {
          select: {
            id:      true,
            title:   true,
            ownerId: true,
          },
        },
        tenant: {
          select: {
            id:              true,
            name:            true,
            email:           true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!lease) {
      return err('Lease not found or does not match the provided tenant and property.', 404);
    }

    // Landlords may only record payments for their own properties
    if (
      session.user.role === 'LANDLORD' &&
      lease.property.ownerId !== session.user.id
    ) {
      return err('Forbidden. You may only record payments for your own properties.', 403);
    }

    // Warn if the lease is not active (allow with a note — don't hard-block)
    if (lease.status === 'TERMINATED' || lease.status === 'EXPIRED') {
      // Still allow recording historical / final payments
      console.warn(
        `[POST /api/payments] Recording payment against a ${lease.status} lease (id=${lease.id}).`,
      );
    }

    // ── Stripe PaymentIntent (optional) ─────────────────────────────────────
    let stripePaymentIntentId: string | null = null;
    let stripeClientSecret:    string | null = null;

    if (data.createPaymentIntent) {
      try {
        // Resolve or use the provided Stripe customer ID
        const effectiveCustomerId =
          data.stripeCustomerId ??
          lease.tenant.stripeCustomerId ??
          null;

        const paymentIntent = await stripe.paymentIntents.create({
          amount:   Math.round(data.amount * 100), // convert to cents
          currency: data.currency,
          // Attach customer if available (enables saved cards, etc.)
          ...(effectiveCustomerId ? { customer: effectiveCustomerId } : {}),
          metadata: {
            leaseId:    data.leaseId,
            tenantId:   data.tenantId,
            propertyId: data.propertyId,
            type:       data.type,
            platform:   'ai-real-estate-platform',
          },
          description:
            data.description ??
            `${data.type} payment for ${lease.property.title} — ${lease.tenant.name}`,
          // Automatic payment methods lets Stripe handle the optimal PM display
          automatic_payment_methods: { enabled: true },
        });

        stripePaymentIntentId = paymentIntent.id;
        stripeClientSecret    = paymentIntent.client_secret;

        // Persist the Stripe customer ID back to the tenant record
        if (!lease.tenant.stripeCustomerId && paymentIntent.customer) {
          await prisma.user.update({
            where: { id: data.tenantId },
            data:  { stripeCustomerId: paymentIntent.customer as string },
          });
        }
      } catch (stripeError) {
        console.error('[POST /api/payments] Stripe PaymentIntent creation failed:', stripeError);
        return err(
          'Failed to create Stripe payment intent. Please check your Stripe configuration and try again.',
          502,
        );
      }
    }

    // ── Persist payment record ───────────────────────────────────────────────
    const payment = await prisma.payment.create({
      data: {
        leaseId:               data.leaseId,
        tenantId:              data.tenantId,
        propertyId:            data.propertyId,
        amount:                data.amount,
        currency:              data.currency,
        type:                  data.type,
        status:                stripePaymentIntentId ? 'PROCESSING' : 'PENDING',
        dueDate:               data.dueDate,
        description:           data.description ?? null,
        notes:                 data.notes       ?? null,
        stripePaymentIntentId: stripePaymentIntentId,
        stripeClientSecret:    stripeClientSecret,
      },
      select: {
        id:                    true,
        amount:                true,
        currency:              true,
        status:                true,
        type:                  true,
        dueDate:               true,
        paidAt:                true,
        description:           true,
        notes:                 true,
        stripePaymentIntentId: true,
        stripeClientSecret:    true,
        createdAt:             true,
        updatedAt:             true,
        tenant: {
          select: { id: true, name: true, email: true },
        },
        property: {
          select: { id: true, title: true, address: true },
        },
        lease: {
          select: { id: true, status: true, rentAmount: true },
        },
      },
    });

    return ok(
      {
        ...payment,
        message: stripePaymentIntentId
          ? 'Payment record created and Stripe PaymentIntent initiated. Share the client secret with the tenant to complete payment.'
          : 'Payment record created successfully.',
      },
      undefined,
      201,
    );
  } catch (error) {
    console.error('[POST /api/payments]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}
