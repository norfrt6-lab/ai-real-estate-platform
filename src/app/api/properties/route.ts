import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// ApiResponse wrapper type
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
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) } satisfies ApiResponse<T>, {
    status,
  });
}

function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message } satisfies ApiResponse<never>, {
    status,
  });
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const CreatePropertySchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(120, 'Title must be at most 120 characters.'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional(),

  address: z
    .string({ required_error: 'Address is required.' })
    .trim()
    .min(5, 'Address must be at least 5 characters.')
    .max(255, 'Address must be at most 255 characters.'),

  city: z.string().trim().min(1, 'City is required.').max(100),
  state: z.string().trim().min(1, 'State is required.').max(100),
  country: z.string().trim().default('US'),
  zipCode: z.string().trim().max(20).optional(),

  type: z.enum(
    ['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO', 'COMMERCIAL', 'LAND'],
    { required_error: 'Property type is required.' },
  ),

  status: z
    .enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNLISTED'])
    .default('AVAILABLE'),

  monthlyRent: z
    .number({ required_error: 'Monthly rent is required.' })
    .positive('Monthly rent must be a positive number.')
    .max(1_000_000, 'Monthly rent seems unrealistically high.'),

  securityDeposit: z.number().nonnegative().optional(),

  bedrooms: z.number().int().nonnegative().max(50).optional(),
  bathrooms: z.number().nonnegative().max(50).optional(),
  squareFeet: z.number().positive().optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 5)
    .optional(),

  amenities: z.array(z.string().trim()).default([]),
  images: z.array(z.string().url('Each image must be a valid URL.')).default([]),
  isActive: z.boolean().default(true),
});

type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;

// ---------------------------------------------------------------------------
// GET /api/properties
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    // Parse query params
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)),
    );
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';
    const type = searchParams.get('type')?.trim() ?? '';
    const minRent = searchParams.get('minRent')
      ? parseFloat(searchParams.get('minRent')!)
      : undefined;
    const maxRent = searchParams.get('maxRent')
      ? parseFloat(searchParams.get('maxRent')!)
      : undefined;
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    // Build Prisma where clause
    const where: Record<string, unknown> = {};

    // Role-based scoping: landlords see only their own properties
    if (session.user.role === 'LANDLORD') {
      where.ownerId = session.user.id;
    } else if (session.user.role === 'TENANT') {
      // Tenants see only properties they're associated with
      where.leases = {
        some: {
          tenantId: session.user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      };
    }
    // SUPER_ADMIN and AGENT see all properties

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status && ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNLISTED'].includes(status)) {
      where.status = status;
    }

    // Type filter
    if (
      type &&
      ['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO', 'COMMERCIAL', 'LAND'].includes(type)
    ) {
      where.type = type;
    }

    // Rent range filter
    if (minRent !== undefined || maxRent !== undefined) {
      where.monthlyRent = {
        ...(minRent !== undefined ? { gte: minRent } : {}),
        ...(maxRent !== undefined ? { lte: maxRent } : {}),
      };
    }

    // Allowed sort fields (whitelist to prevent injection)
    const allowedSortFields = ['createdAt', 'updatedAt', 'monthlyRent', 'title', 'status'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Run count + paginated query in parallel
    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy: { [orderByField]: orderByDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
            select: { id: true, name: true, email: true, image: true },
          },
          leases: {
            where: { status: 'ACTIVE' },
            take: 1,
            select: {
              id: true,
              status: true,
              tenant: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          _count: {
            select: { maintenanceTickets: true, leases: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return ok(properties, { page, pageSize, total, totalPages });
  } catch (error) {
    console.error('[GET /api/properties]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/properties
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return err('Unauthorized. Please sign in to continue.', 401);
    }

    // Only landlords, agents, and admins can create properties
    const allowedRoles = ['LANDLORD', 'AGENT', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return err('Forbidden. You do not have permission to create properties.', 403);
    }

    // Parse & validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON payload.', 400);
    }

    const parsed = CreatePropertySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return err(firstError?.message ?? 'Validation failed.', 422);
    }

    const data: CreatePropertyInput = parsed.data;

    // Create property in DB
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        type: data.type,
        status: data.status,
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFeet: data.squareFeet,
        yearBuilt: data.yearBuilt,
        amenities: data.amenities,
        images: data.images,
        isActive: data.isActive,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        state: true,
        type: true,
        status: true,
        monthlyRent: true,
        bedrooms: true,
        bathrooms: true,
        createdAt: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ok(property, undefined, 201);
  } catch (error) {
    console.error('[POST /api/properties]', error);
    return err('An unexpected error occurred. Please try again later.', 500);
  }
}
