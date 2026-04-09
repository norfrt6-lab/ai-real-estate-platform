import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// ApiResponse wrapper helpers
// ---------------------------------------------------------------------------
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status });
}

function err(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse<never>,
    { status },
  );
}

// ---------------------------------------------------------------------------
// Zod schema for PATCH (all fields optional)
// ---------------------------------------------------------------------------
const UpdatePropertySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(120, 'Title must be at most 120 characters.')
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .min(5, 'Address must be at least 5 characters.')
    .max(255)
    .optional(),

  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  country: z.string().trim().max(100).optional(),
  zipCode: z.string().trim().max(20).optional().nullable(),

  type: z
    .enum(['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO', 'COMMERCIAL', 'LAND'])
    .optional(),

  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNLISTED']).optional(),

  monthlyRent: z
    .number()
    .positive('Monthly rent must be a positive number.')
    .max(1_000_000)
    .optional(),

  securityDeposit: z.number().nonnegative().optional().nullable(),

  bedrooms: z.number().int().nonnegative().max(50).optional().nullable(),
  bathrooms: z.number().nonnegative().max(50).optional().nullable(),
  squareFeet: z.number().positive().optional().nullable(),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 5)
    .optional()
    .nullable(),

  amenities: z.array(z.string().trim()).optional(),
  images: z.array(z.string().url('Each image must be a valid URL.')).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Shared: resolve property + perform auth/ownership guard
// ---------------------------------------------------------------------------
type RouteContext = { params: { id: string } };

async function resolveProperty(id: string) {
  return prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
      type: true,
      status: true,
      monthlyRent: true,
      securityDeposit: true,
      bedrooms: true,
      bathrooms: true,
      squareFeet: true,
      yearBuilt: true,
      amenities: true,
      images: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      leases: {
        where: { status: 'ACTIVE' },
        take: 1,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          rentAmount: true,
          tenant: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      maintenanceTickets: {
        where: { status: { notIn: ['CLOSED', 'RESOLVED'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          leases: true,
          maintenanceTickets: true,
        },
      },
    },
  });
}

/** Returns true when the authenticated user may mutate (update/delete) the property. */
function canMutate(role: string, userId: string, ownerId: string): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'LANDLORD' && ownerId === userId) return true;
  if (role === 'AGENT' && ownerId === userId) return true;
  return false;
}

// ---------------------------------------------------------------------------
// GET /api/properties/[id]
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    const property = await resolveProperty(params.id);

    if (!property) {
      return err('Property not found.', 404);
    }

    // Tenants may only view properties they have an active lease on
    if (session.user.role === 'TENANT') {
      const hasLease = await prisma.lease.findFirst({
        where: {
          propertyId: params.id,
          tenantId: session.user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      });
      if (!hasLease) {
        return err('Forbidden. You do not have access to this property.', 403);
      }
    }

    return ok(property);
  } catch (error) {
    console.error('[GET /api/properties/:id]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/properties/[id]
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    // Fetch existing property (lightweight — just what we need for auth)
    const existing = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, title: true },
    });

    if (!existing) {
      return err('Property not found.', 404);
    }

    if (!canMutate(session.user.role, session.user.id, existing.ownerId)) {
      return err('Forbidden. You do not have permission to update this property.', 403);
    }

    // Parse & validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON payload.', 400);
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return err('Request body must be a JSON object.', 400);
    }

    const parsed = UpdatePropertySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return err(firstError?.message ?? 'Validation failed.', 422);
    }

    // Guard: if no fields were provided, return 400
    const updateData = parsed.data;
    if (Object.keys(updateData).length === 0) {
      return err('No fields provided for update.', 400);
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
        type: true,
        status: true,
        monthlyRent: true,
        securityDeposit: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        yearBuilt: true,
        amenities: true,
        images: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ok(updated);
  } catch (error) {
    console.error('[PATCH /api/properties/:id]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/properties/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    const existing = await prisma.property.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        title: true,
        _count: {
          select: {
            leases: true,
          },
        },
      },
    });

    if (!existing) {
      return err('Property not found.', 404);
    }

    if (!canMutate(session.user.role, session.user.id, existing.ownerId)) {
      return err('Forbidden. You do not have permission to delete this property.', 403);
    }

    // Safety: prevent deletion if there are active leases
    const activeLeaseCount = await prisma.lease.count({
      where: {
        propertyId: params.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (activeLeaseCount > 0) {
      return err(
        `Cannot delete property "${existing.title}": it has ${activeLeaseCount} active lease(s). ` +
          'Please terminate all leases before deleting the property.',
        409,
      );
    }

    // Soft-delete approach: mark inactive rather than hard-delete
    // (preserves historical payment / maintenance records)
    await prisma.property.update({
      where: { id: params.id },
      data: {
        isActive: false,
        status: 'UNLISTED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Property "${existing.title}" has been deactivated and unlisted.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[DELETE /api/properties/:id]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}
