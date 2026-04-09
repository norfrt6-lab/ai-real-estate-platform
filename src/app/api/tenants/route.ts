import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
const CreateTenantSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(120, 'Name must be at most 120 characters.'),

  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),

  phone: z
    .string()
    .trim()
    .max(30, 'Phone must be at most 30 characters.')
    .optional()
    .nullable(),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.'),

  // Optional lease details to create alongside the tenant
  lease: z
    .object({
      propertyId: z.string({ required_error: 'Property ID is required for lease.' }),
      startDate: z.coerce.date({ required_error: 'Lease start date is required.' }),
      endDate: z.coerce.date({ required_error: 'Lease end date is required.' }),
      rentAmount: z
        .number({ required_error: 'Rent amount is required.' })
        .positive('Rent amount must be a positive number.'),
      securityDeposit: z.number().nonnegative().optional(),
      notes: z.string().trim().max(1000).optional(),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: 'Lease end date must be after start date.',
      path: ['endDate'],
    })
    .optional(),

  // Extra profile metadata
  emergencyContact: z
    .object({
      name: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(30),
      relationship: z.string().trim().max(60).optional(),
    })
    .optional()
    .nullable(),
});

type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// ---------------------------------------------------------------------------
// Role guards
// ---------------------------------------------------------------------------
const ADMIN_ROLES = ['SUPER_ADMIN', 'LANDLORD', 'AGENT'] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

// ---------------------------------------------------------------------------
// GET /api/tenants
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    if (!isAdminRole(session.user.role)) {
      return err('Forbidden. Insufficient permissions to view tenants.', 403);
    }

    // ── Query params ────────────────────────────────────────────────────────
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)),
    );
    const search = searchParams.get('search')?.trim() ?? '';
    const leaseStatus = searchParams.get('leaseStatus')?.trim() ?? '';
    const propertyId = searchParams.get('propertyId')?.trim() ?? '';
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    // ── Where clause ────────────────────────────────────────────────────────
    const where: Record<string, unknown> = {
      role: 'TENANT',
    };

    // Landlords can only see tenants whose leases are on their properties
    if (session.user.role === 'LANDLORD') {
      where.leases = {
        some: {
          property: { ownerId: session.user.id },
        },
      };
    }

    // Free-text search across name, email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by active lease status
    if (
      leaseStatus &&
      ['ACTIVE', 'PENDING', 'EXPIRED', 'TERMINATED'].includes(leaseStatus)
    ) {
      where.leases = {
        some: { status: leaseStatus },
      };
    }

    // Filter by specific property
    if (propertyId) {
      where.leases = {
        some: { propertyId },
      };
    }

    // Whitelist sort fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // ── Execute queries ─────────────────────────────────────────────────────
    const [total, tenants] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { [orderByField]: orderByDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Most recent lease (any status) for overview
          leases: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              rentAmount: true,
              securityDeposit: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  state: true,
                  type: true,
                  status: true,
                },
              },
            },
          },
          // Counts for quick overview
          _count: {
            select: {
              leases: true,
              payments: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    // Reshape to a cleaner API surface
    const shaped = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      image: t.image,
      role: t.role,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lease: t.leases[0] ?? null,
      property: t.leases[0]?.property ?? null,
      counts: t._count,
    }));

    return ok(shaped, { page, pageSize, total, totalPages });
  } catch (error) {
    console.error('[GET /api/tenants]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/tenants
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    if (!isAdminRole(session.user.role)) {
      return err('Forbidden. Only landlords, agents, and admins can add tenants.', 403);
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON payload.', 400);
    }

    const parsed = CreateTenantSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return err(firstError?.message ?? 'Validation failed.', 422);
    }

    const data: CreateTenantInput = parsed.data;

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existing) {
      return err('A user with that email address already exists.', 409);
    }

    // ── If a lease is requested, verify the property ─────────────────────────
    if (data.lease) {
      const property = await prisma.property.findUnique({
        where: { id: data.lease.propertyId },
        select: { id: true, ownerId: true, status: true, title: true },
      });

      if (!property) {
        return err('The specified property does not exist.', 404);
      }

      // Landlords can only assign tenants to their own properties
      if (
        session.user.role === 'LANDLORD' &&
        property.ownerId !== session.user.id
      ) {
        return err(
          'Forbidden. You can only assign tenants to your own properties.',
          403,
        );
      }

      if (property.status === 'OCCUPIED') {
        return err(
          `Property "${property.title}" is already occupied. Please mark it available before adding a new tenant.`,
          409,
        );
      }

      if (property.status === 'UNLISTED') {
        return err(
          `Property "${property.title}" is unlisted. Please activate it before assigning a tenant.`,
          409,
        );
      }
    }

    // ── Hash password ───────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // ── Create user + optional lease in a transaction ───────────────────────
    const tenant = await prisma.$transaction(async (tx) => {
      // Create the tenant user
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          password: hashedPassword,
          role: 'TENANT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });

      // If lease details were provided, create the lease and update property
      if (data.lease) {
        await tx.lease.create({
          data: {
            tenantId: newUser.id,
            propertyId: data.lease.propertyId,
            startDate: data.lease.startDate,
            endDate: data.lease.endDate,
            rentAmount: data.lease.rentAmount,
            securityDeposit: data.lease.securityDeposit ?? null,
            notes: data.lease.notes ?? null,
            status: 'PENDING',
          },
        });

        // Mark property as occupied
        await tx.property.update({
          where: { id: data.lease.propertyId },
          data: { status: 'OCCUPIED', updatedAt: new Date() },
        });
      }

      return newUser;
    });

    return ok(
      {
        ...tenant,
        message: data.lease
          ? 'Tenant created and lease initiated successfully.'
          : 'Tenant created successfully.',
      },
      undefined,
      201,
    );
  } catch (error) {
    console.error('[POST /api/tenants]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}
