import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

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
// Priority levels
// ---------------------------------------------------------------------------
type TicketPriority = 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';

const VALID_PRIORITIES: TicketPriority[] = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'];

const VALID_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_PARTS',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
] as const;

type TicketStatus = (typeof VALID_STATUSES)[number];

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const CreateMaintenanceTicketSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(5, 'Title must be at least 5 characters.')
    .max(200, 'Title must be at most 200 characters.'),

  description: z
    .string({ required_error: 'Description is required.' })
    .trim()
    .min(10, 'Description must be at least 10 characters.')
    .max(5000, 'Description must be at most 5000 characters.'),

  propertyId: z
    .string({ required_error: 'Property ID is required.' })
    .min(1, 'Property ID cannot be empty.'),

  tenantId: z.string().optional().nullable(),

  // If provided, skip AI classification and use this priority directly
  priority: z
    .enum(['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'])
    .optional(),

  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'AWAITING_PARTS', 'RESOLVED', 'CLOSED', 'CANCELLED'])
    .default('OPEN'),

  vendorId: z.string().optional().nullable(),

  estimatedCost: z
    .number()
    .nonnegative('Estimated cost must be a non-negative number.')
    .optional()
    .nullable(),

  scheduledDate: z.coerce.date().optional().nullable(),

  images: z
    .array(z.string().url('Each image must be a valid URL.'))
    .default([]),

  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be at most 2000 characters.')
    .optional()
    .nullable(),

  // Whether to run AI classification (true by default unless priority is manually set)
  useAiClassification: z.boolean().default(true),
});

type CreateMaintenanceTicketInput = z.infer<typeof CreateMaintenanceTicketSchema>;

// ---------------------------------------------------------------------------
// AI Priority Classification (stub backed by OpenAI)
// ---------------------------------------------------------------------------
interface AiClassificationResult {
  priority: TicketPriority;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedCategory: string;
  estimatedResolutionDays: number;
}

/**
 * Classifies the priority of a maintenance ticket using GPT-4.
 *
 * Falls back to 'MEDIUM' priority on any error so that ticket creation
 * is never blocked by an AI failure.
 */
async function classifyMaintenancePriority(
  title: string,
  description: string,
): Promise<AiClassificationResult> {
  const systemPrompt = `You are an expert property maintenance coordinator AI.
Your job is to classify the urgency/priority of maintenance tickets for a real estate management platform.

Priority levels and their criteria:
- EMERGENCY: Immediate safety hazard, risk to life or property (gas leak, fire, flooding, electrical sparks, structural collapse risk, no heat in freezing weather). Must be addressed within hours.
- HIGH: Significant inconvenience or potential for serious damage if not addressed soon (broken HVAC in extreme weather, major water leak, broken door lock, pest infestation, sewage backup). Address within 24–48 hours.
- MEDIUM: Affects quality of life but not an immediate safety risk (broken appliance, minor leak, heating/cooling issues in mild weather, broken window, non-functional bathroom fixture). Address within 1 week.
- LOW: Cosmetic, routine maintenance, or minor inconveniences (paint scuffs, squeaky door, minor landscaping, bulb replacement, general upkeep). Address within 30 days.

Respond ONLY with a valid JSON object matching this exact shape:
{
  "priority": "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "<one-sentence explanation>",
  "confidence": "high" | "medium" | "low",
  "suggestedCategory": "<e.g. Plumbing | HVAC | Electrical | Structural | Appliances | Pest Control | General>",
  "estimatedResolutionDays": <integer>
}`;

  const userMessage = `Maintenance Ticket Title: ${title}\n\nDescription: ${description}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // cost-effective model suitable for classification tasks
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1, // low temperature for more deterministic classification
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<AiClassificationResult>;

    // Validate and sanitize the AI response
    const priority: TicketPriority =
      parsed.priority && VALID_PRIORITIES.includes(parsed.priority)
        ? parsed.priority
        : 'MEDIUM';

    return {
      priority,
      reasoning:
        parsed.reasoning ?? 'Priority determined by AI classification.',
      confidence: parsed.confidence ?? 'medium',
      suggestedCategory: parsed.suggestedCategory ?? 'General',
      estimatedResolutionDays:
        typeof parsed.estimatedResolutionDays === 'number' &&
        parsed.estimatedResolutionDays > 0
          ? Math.round(parsed.estimatedResolutionDays)
          : priority === 'EMERGENCY'
          ? 1
          : priority === 'HIGH'
          ? 2
          : priority === 'MEDIUM'
          ? 7
          : 30,
    };
  } catch (aiError) {
    // Log the error but don't fail ticket creation — fall back to MEDIUM
    console.error('[maintenance/route] AI classification failed:', aiError);
    return {
      priority: 'MEDIUM',
      reasoning: 'AI classification unavailable; defaulting to MEDIUM priority.',
      confidence: 'low',
      suggestedCategory: 'General',
      estimatedResolutionDays: 7,
    };
  }
}

// ---------------------------------------------------------------------------
// Role guards
// ---------------------------------------------------------------------------
const ALL_ROLES = ['SUPER_ADMIN', 'LANDLORD', 'AGENT', 'TENANT'] as const;

function isAuthenticated(role: string): boolean {
  return (ALL_ROLES as readonly string[]).includes(role);
}

function isAdminRole(role: string): boolean {
  return ['SUPER_ADMIN', 'LANDLORD', 'AGENT'].includes(role);
}

// ---------------------------------------------------------------------------
// GET /api/maintenance
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user || !isAuthenticated(session.user.role)) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    // ── Query params ─────────────────────────────────────────────────────────
    const { searchParams } = request.nextUrl;

    const page       = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
    const pageSize   = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)));
    const search     = searchParams.get('search')?.trim()    ?? '';
    const priority   = searchParams.get('priority')?.trim()  ?? '';
    const status     = searchParams.get('status')?.trim()    ?? '';
    const propertyId = searchParams.get('propertyId')?.trim() ?? '';
    const tenantId   = searchParams.get('tenantId')?.trim()  ?? '';
    const vendorId   = searchParams.get('vendorId')?.trim()  ?? '';
    const sortBy     = searchParams.get('sortBy')   ?? 'createdAt';
    const sortOrder  = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    // ── Build where clause ───────────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    // Role-based scoping
    if (session.user.role === 'TENANT') {
      // Tenants see only their own tickets
      where.tenantId = session.user.id;
    } else if (session.user.role === 'LANDLORD') {
      // Landlords see tickets for their properties
      where.property = { ownerId: session.user.id };
    }
    // SUPER_ADMIN and AGENT see all

    // Free-text search
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { property:    { title:   { contains: search, mode: 'insensitive' } } },
        { tenant:      { name:    { contains: search, mode: 'insensitive' } } },
        { vendor:      { name:    { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Priority filter
    if (priority && VALID_PRIORITIES.includes(priority as TicketPriority)) {
      where.priority = priority;
    }

    // Status filter
    if (status && VALID_STATUSES.includes(status as TicketStatus)) {
      where.status = status;
    }

    // Property filter
    if (propertyId) {
      where.propertyId = propertyId;
    }

    // Tenant filter (landlord/admin use-case)
    if (tenantId && session.user.role !== 'TENANT') {
      where.tenantId = tenantId;
    }

    // Vendor filter
    if (vendorId) {
      where.vendorId = vendorId;
    }

    // Whitelist sort fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'estimatedCost', 'scheduledDate'];
    const orderByField      = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderByDirection  = sortOrder === 'asc' ? 'asc' : 'desc';

    // ── Execute queries ──────────────────────────────────────────────────────
    const [total, tickets] = await Promise.all([
      prisma.maintenanceTicket.count({ where }),
      prisma.maintenanceTicket.findMany({
        where,
        orderBy: { [orderByField]: orderByDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id:                  true,
          title:               true,
          description:         true,
          priority:            true,
          status:              true,
          estimatedCost:       true,
          actualCost:          true,
          scheduledDate:       true,
          resolvedAt:          true,
          images:              true,
          notes:               true,
          aiPriorityReason:    true,
          aiConfidence:        true,
          aiCategory:          true,
          estimatedResolutionDays: true,
          createdAt:           true,
          updatedAt:           true,
          property: {
            select: {
              id:      true,
              title:   true,
              address: true,
              city:    true,
              state:   true,
              type:    true,
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          tenant: {
            select: { id: true, name: true, email: true, image: true, phone: true },
          },
          vendor: {
            select: { id: true, name: true, specialty: true, phone: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return ok(tickets, { page, pageSize, total, totalPages });
  } catch (error) {
    console.error('[GET /api/maintenance]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/maintenance
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    // ── Parse & validate body ────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON payload.', 400);
    }

    const parsed = CreateMaintenanceTicketSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return err(firstError?.message ?? 'Validation failed.', 422);
    }

    const data: CreateMaintenanceTicketInput = parsed.data;

    // ── Verify the property exists ───────────────────────────────────────────
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: {
        id:      true,
        title:   true,
        ownerId: true,
        isActive: true,
      },
    });

    if (!property) {
      return err('Property not found.', 404);
    }

    if (!property.isActive) {
      return err('Cannot create a maintenance ticket for an inactive property.', 409);
    }

    // Tenants can only create tickets for properties they have an active lease on
    if (session.user.role === 'TENANT') {
      const hasLease = await prisma.lease.findFirst({
        where: {
          propertyId: data.propertyId,
          tenantId:   session.user.id,
          status:     { in: ['ACTIVE', 'PENDING'] },
        },
        select: { id: true },
      });

      if (!hasLease) {
        return err(
          'Forbidden. You may only open tickets for properties you are leasing.',
          403,
        );
      }

      // Tenant can only submit on their own behalf
      if (data.tenantId && data.tenantId !== session.user.id) {
        return err('Forbidden. Tenants may only create tickets on their own behalf.', 403);
      }
    }

    // Landlords can only create tickets for their own properties
    if (session.user.role === 'LANDLORD' && property.ownerId !== session.user.id) {
      return err('Forbidden. You may only create tickets for your own properties.', 403);
    }

    // ── Verify the vendor exists if provided ─────────────────────────────────
    if (data.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: data.vendorId },
        select: { id: true },
      });
      if (!vendor) {
        return err(`Vendor with ID "${data.vendorId}" not found.`, 404);
      }
    }

    // ── Verify the tenant exists if provided ─────────────────────────────────
    const effectiveTenantId =
      data.tenantId ??
      (session.user.role === 'TENANT' ? session.user.id : null);

    if (effectiveTenantId) {
      const tenant = await prisma.user.findUnique({
        where: { id: effectiveTenantId },
        select: { id: true, role: true },
      });
      if (!tenant) {
        return err(`Tenant with ID "${effectiveTenantId}" not found.`, 404);
      }
      if (tenant.role !== 'TENANT') {
        return err('The provided tenantId does not belong to a tenant user.', 422);
      }
    }

    // ── AI Priority Classification ───────────────────────────────────────────
    let finalPriority: TicketPriority;
    let aiResult: AiClassificationResult | null = null;

    if (data.priority) {
      // Manual override — skip AI
      finalPriority = data.priority;
    } else if (data.useAiClassification) {
      // Run AI classification
      aiResult = await classifyMaintenancePriority(data.title, data.description);
      finalPriority = aiResult.priority;
    } else {
      // No manual priority and AI disabled — default to MEDIUM
      finalPriority = 'MEDIUM';
    }

    // ── Create the ticket ────────────────────────────────────────────────────
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title:          data.title,
        description:    data.description,
        propertyId:     data.propertyId,
        tenantId:       effectiveTenantId ?? null,
        vendorId:       data.vendorId     ?? null,
        priority:       finalPriority,
        status:         data.status,
        estimatedCost:  data.estimatedCost ?? null,
        scheduledDate:  data.scheduledDate ?? null,
        images:         data.images,
        notes:          data.notes ?? null,

        // AI metadata (stored for audit / transparency)
        aiPriorityReason:        aiResult?.reasoning          ?? null,
        aiConfidence:            aiResult?.confidence         ?? null,
        aiCategory:              aiResult?.suggestedCategory  ?? null,
        estimatedResolutionDays: aiResult?.estimatedResolutionDays ?? null,
      },
      select: {
        id:                      true,
        title:                   true,
        description:             true,
        priority:                true,
        status:                  true,
        estimatedCost:           true,
        scheduledDate:           true,
        images:                  true,
        notes:                   true,
        aiPriorityReason:        true,
        aiConfidence:            true,
        aiCategory:              true,
        estimatedResolutionDays: true,
        createdAt:               true,
        updatedAt:               true,
        property: {
          select: { id: true, title: true, address: true },
        },
        tenant: {
          select: { id: true, name: true, email: true },
        },
        vendor: {
          select: { id: true, name: true, specialty: true, phone: true },
        },
      },
    });

    return ok(
      {
        ...ticket,
        aiClassification: aiResult
          ? {
              usedAi:     true,
              priority:   aiResult.priority,
              reasoning:  aiResult.reasoning,
              confidence: aiResult.confidence,
              category:   aiResult.suggestedCategory,
              estimatedResolutionDays: aiResult.estimatedResolutionDays,
            }
          : {
              usedAi:   false,
              priority: finalPriority,
              note:     data.priority
                ? 'Priority was manually set; AI classification skipped.'
                : 'AI classification was disabled for this request.',
            },
        message: `Maintenance ticket created with ${finalPriority} priority${aiResult ? ' (AI-classified)' : ''}.`,
      },
      undefined,
      201,
    );
  } catch (error) {
    console.error('[POST /api/maintenance]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}
