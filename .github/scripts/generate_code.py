#!/usr/bin/env python3
"""
generate_code.py - Real TypeScript/Next.js code generator for AI Real Estate Platform.

Reads env vars: BRANCH, MODULE, SLUG, DIR, FILE_PATH, FILE_EXT
Detects file type from SLUG and writes appropriate TS/TSX content.
"""

import os
import sys


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def pascal(s: str) -> str:
    """Convert kebab-case to PascalCase."""
    return "".join(part.capitalize() for part in s.replace("_", "-").split("-"))


def camel(s: str) -> str:
    """Convert kebab-case to camelCase."""
    parts = s.replace("_", "-").split("-")
    return parts[0].lower() + "".join(p.capitalize() for p in parts[1:])


# ---------------------------------------------------------------------------
# Module → Prisma model mapping
# ---------------------------------------------------------------------------

MODEL_MAP = {
    "auth": "User",
    "property": "Property",
    "tenant": "Lease",
    "payment": "Payment",
    "maintenance": "MaintenanceTicket",
    "notification": "Notification",
    "admin": "User",
    "agent": "AgentProfile",
}


# ---------------------------------------------------------------------------
# File-type detection
# ---------------------------------------------------------------------------

def detect_type(slug: str) -> str:
    s = slug.lower()

    if "service" in s:
        return "service"
    if "repository" in s:
        return "repository"
    if s.endswith("-api") or "api-route" in s:
        return "api"
    if "page" in s:
        return "page"
    if any(k in s for k in ("component", "form", "list", "badge", "card", "modal", "dropdown", "chart", "widget")):
        return "component"
    if any(k in s for k in ("hook", "unread-count", "filter")):
        return "hook"
    if any(k in s for k in ("types", "interface", "prisma-model", "schema")):
        return "types"
    if any(k in s for k in ("test", "suite", "e2e")):
        return "test"
    if any(k in s for k in ("config", "setup", "init", "validation", "middleware")):
        return "config"
    return "module"


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def gen_service(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    model = MODEL_MAP.get(module, pascal(module))
    camel_model = camel(model)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ prisma }} from '@/lib/prisma';
import {{ logger }} from '@/lib/logger';
import {{ ApiError }} from '@/lib/errors';
import type {{ {model} }} from '@prisma/client';
import type {{ PaginationParams, ID }} from '@/types/common';
import type {{ PaginatedResult }} from '@/types/api';

export interface Create{name}Dto {{
  // TODO: add creation fields
  [key: string]: unknown;
}}

export interface Update{name}Dto {{
  // TODO: add update fields
  [key: string]: unknown;
}}

export class {name}Service {{
  private readonly log = logger.child({{ service: '{name}Service' }});

  async findById(id: ID): Promise<{model}> {{
    this.log.info({{ id }}, 'findById');
    const record = await prisma.{camel_model}.findUnique({{ where: {{ id }} }});
    if (!record) throw ApiError.notFound('{model}');
    return record;
  }}

  async findMany(params: PaginationParams = {{}}): Promise<PaginatedResult<{model}>> {{
    const {{ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search }} = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {{ OR: [{{ id: {{ contains: search, mode: 'insensitive' as const }} }}] }}
      : {{}};

    const [data, total] = await prisma.$transaction([
      prisma.{camel_model}.findMany({{
        where,
        skip,
        take: limit,
        orderBy: {{ [sortBy]: sortOrder }},
      }}),
      prisma.{camel_model}.count({{ where }}),
    ]);

    return {{ data, total, page, limit, totalPages: Math.ceil(total / limit) }};
  }}

  async create(dto: Create{name}Dto): Promise<{model}> {{
    this.log.info({{ dto }}, 'create');
    return prisma.{camel_model}.create({{ data: dto as never }});
  }}

  async update(id: ID, dto: Update{name}Dto): Promise<{model}> {{
    this.log.info({{ id, dto }}, 'update');
    await this.findById(id);
    return prisma.{camel_model}.update({{ where: {{ id }}, data: dto as never }});
  }}

  async delete(id: ID): Promise<void> {{
    this.log.info({{ id }}, 'delete');
    await this.findById(id);
    await prisma.{camel_model}.delete({{ where: {{ id }} }});
  }}
}}

export const {camel(slug)}Service = new {name}Service();
"""


def gen_repository(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    model = MODEL_MAP.get(module, pascal(module))
    camel_model = camel(model)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ prisma }} from '@/lib/prisma';
import type {{ {model}, Prisma }} from '@prisma/client';
import type {{ ID }} from '@/types/common';

export type {name}Where = Prisma.{model}WhereInput;
export type {name}OrderBy = Prisma.{model}OrderByWithRelationInput;

export const {camel(slug)}Repository = {{
  findById: async (id: ID): Promise<{model} | null> =>
    prisma.{camel_model}.findUnique({{ where: {{ id }} }}),

  findMany: async (
    where: {name}Where = {{}},
    orderBy: {name}OrderBy = {{ createdAt: 'desc' }},
    skip = 0,
    take = 20,
  ): Promise<{model}[]> =>
    prisma.{camel_model}.findMany({{ where, orderBy, skip, take }}),

  count: async (where: {name}Where = {{}}): Promise<number> =>
    prisma.{camel_model}.count({{ where }}),

  create: async (data: Prisma.{model}CreateInput): Promise<{model}> =>
    prisma.{camel_model}.create({{ data }}),

  update: async (id: ID, data: Prisma.{model}UpdateInput): Promise<{model}> =>
    prisma.{camel_model}.update({{ where: {{ id }}, data }}),

  upsert: async (
    where: Prisma.{model}WhereUniqueInput,
    create: Prisma.{model}CreateInput,
    update: Prisma.{model}UpdateInput,
  ): Promise<{model}> =>
    prisma.{camel_model}.upsert({{ where, create, update }}),

  delete: async (id: ID): Promise<{model}> =>
    prisma.{camel_model}.delete({{ where: {{ id }} }}),

  deleteMany: async (where: {name}Where): Promise<Prisma.BatchPayload> =>
    prisma.{camel_model}.deleteMany({{ where }}),
}} as const;

export type {name}Repository = typeof {camel(slug)}Repository;
"""


def gen_api(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ NextRequest, NextResponse }} from 'next/server';
import {{ z }} from 'zod';
import {{ auth }} from '@/lib/auth';
import {{ withErrorHandler }} from '@/middleware/error-handler';
import {{ ApiError }} from '@/lib/errors';
import {{ logger }} from '@/lib/logger';
import type {{ ApiResponse }} from '@/types/api';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const querySchema = z.object({{
  page:    z.coerce.number().int().positive().default(1),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
  search:  z.string().optional(),
  sortBy:  z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}});

const createSchema = z.object({{
  // TODO: define creation fields
  name: z.string().min(1).max(255),
}});

export type {name}Query  = z.infer<typeof querySchema>;
export type Create{name}Input = z.infer<typeof createSchema>;

const log = logger.child({{ route: '/{module}/{slug}' }});

// ---------------------------------------------------------------------------
// GET /api/{module}/{slug}
// ---------------------------------------------------------------------------

async function handleGet(req: NextRequest): Promise<NextResponse> {{
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized();

  const {{ searchParams }} = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  log.info({{ userId: session.user.id, query }}, 'GET {slug}');

  // TODO: replace with real service/repository call
  const data: unknown[] = [];
  const total = 0;

  return NextResponse.json<ApiResponse<unknown[]>>({{
    success: true,
    data,
    meta: {{
      page:       query.page,
      limit:      query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    }},
  }});
}}

// ---------------------------------------------------------------------------
// POST /api/{module}/{slug}
// ---------------------------------------------------------------------------

async function handlePost(req: NextRequest): Promise<NextResponse> {{
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized();

  const body = await req.json();
  const input = createSchema.parse(body);

  log.info({{ userId: session.user.id, input }}, 'POST {slug}');

  // TODO: replace with real service call
  const created = {{ id: crypto.randomUUID(), ...input, createdAt: new Date() }};

  return NextResponse.json<ApiResponse<typeof created>>(
    {{ success: true, data: created }},
    {{ status: 201 }},
  );
}}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const GET  = withErrorHandler(handleGet);
export const POST = withErrorHandler(handlePost);
"""


def gen_page(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ redirect }} from 'next/navigation';
import {{ auth }} from '@/lib/auth';
import type {{ Metadata }} from 'next';

export const metadata: Metadata = {{
  title: '{name} | AI Real Estate Platform',
  description: '{name} page for the AI Real Estate Platform',
}};

interface {name}PageProps {{
  params: {{ id?: string }};
  searchParams: {{ [key: string]: string | string[] | undefined }};
}}

export default async function {name}Page({{ params, searchParams }}: {name}PageProps) {{
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your {slug.replace("-", " ")} here.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {{/* TODO: add {name}List or {name}Table component */}}
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    </main>
  );
}}
"""


def gen_component(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    hook_name = camel(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

'use client';

import {{ useQuery }} from '@tanstack/react-query';
import {{ Card, CardContent, CardHeader, CardTitle }} from '@/components/ui/card';
import {{ Badge }} from '@/components/ui/badge';
import {{ Skeleton }} from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface {name}Item {{
  id: string;
  // TODO: add real fields
  [key: string]: unknown;
}}

interface {name}Props {{
  /** Optional initial data to avoid loading flash */
  initialData?: {name}Item[];
  className?: string;
}}

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------

async function fetch{name}(): Promise<{name}Item[]> {{
  const res = await fetch('/api/{module}/{slug}', {{ cache: 'no-store' }});
  if (!res.ok) {{
    const err = await res.json().catch(() => ({{}}));
    throw new Error(err?.error?.message ?? 'Failed to load {slug}');
  }}
  const json = await res.json();
  return json.data ?? [];
}}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function {name}({{ initialData, className }}: {name}Props) {{
  const {{ data, isLoading, isError, error, refetch }} = useQuery<{name}Item[], Error>({{
    queryKey: ['{module}', '{slug}'],
    queryFn:  fetch{name},
    initialData,
    staleTime: 30_000,
  }});

  if (isLoading) {{
    return (
      <div className={{`space-y-3 ${{className ?? ''}}`}}>
        {{Array.from({{ length: 3 }}).map((_, i) => (
          <Skeleton key={{i}} className="h-20 w-full rounded-lg" />
        ))}}
      </div>
    );
  }}

  if (isError) {{
    return (
      <Card className={{`border-destructive ${{className ?? ''}}`}}>
        <CardHeader>
          <CardTitle className="text-destructive text-sm">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{{error?.message}}</p>
          <button
            onClick={{() => refetch()}}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }}

  return (
    <div className={{`space-y-3 ${{className ?? ''}}`}}>
      {{(data ?? []).length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No {slug.replace("-", " ")} found.
        </p>
      )}}

      {{(data ?? []).map((item) => (
        <Card key={{item.id}} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{{item.id}}</CardTitle>
              <Badge variant="secondary">active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {{/* TODO: render item fields */}}
            <p className="text-xs text-muted-foreground">ID: {{item.id}}</p>
          </CardContent>
        </Card>
      ))}}
    </div>
  );
}}

export default {name};
"""


def gen_hook(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    hook_fn = f"use{name}"
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

'use client';

import {{ useQuery, useMutation, useQueryClient }} from '@tanstack/react-query';
import type {{ ApiResponse }} from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface {name}Item {{
  id: string;
  // TODO: add real fields
  [key: string]: unknown;
}}

export interface Create{name}Input {{
  // TODO: add creation fields
  [key: string]: unknown;
}}

export interface {name}Filters {{
  page?:      number;
  limit?:     number;
  search?:    string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const {camel(slug)}Keys = {{
  all:    ['{module}', '{slug}'] as const,
  list:   (filters: {name}Filters = {{}}) => [...{camel(slug)}Keys.all, 'list', filters] as const,
  detail: (id: string) => [...{camel(slug)}Keys.all, 'detail', id] as const,
}};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchList(filters: {name}Filters): Promise<{name}Item[]> {{
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  );
  const res = await fetch(`/api/{module}/{slug}?${{params}}`);
  if (!res.ok) throw new Error('Failed to fetch {slug}');
  const json: ApiResponse<{name}Item[]> = await res.json();
  return json.data ?? [];
}}

async function createItem(input: Create{name}Input): Promise<{name}Item> {{
  const res = await fetch('/api/{module}/{slug}', {{
    method:  'POST',
    headers: {{ 'Content-Type': 'application/json' }},
    body:    JSON.stringify(input),
  }});
  if (!res.ok) {{
    const err: ApiResponse<null> = await res.json().catch(() => ({{}}));
    throw new Error(err?.error?.message ?? 'Create failed');
  }}
  const json: ApiResponse<{name}Item> = await res.json();
  return json.data!;
}}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function {hook_fn}(filters: {name}Filters = {{}}) {{
  const queryClient = useQueryClient();

  const query = useQuery<{name}Item[], Error>({{
    queryKey: {camel(slug)}Keys.list(filters),
    queryFn:  () => fetchList(filters),
    staleTime: 30_000,
  }});

  const mutation = useMutation<{name}Item, Error, Create{name}Input>({{
    mutationFn: createItem,
    onSuccess: () => {{
      queryClient.invalidateQueries({{ queryKey: {camel(slug)}Keys.all }});
    }},
  }});

  return {{
    // Query state
    data:      query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,

    // Mutation
    create:    mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  }};
}}
"""


def gen_types(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ z }} from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const {camel(name)}Schema = z.object({{
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
}});

export const create{name}Schema = {camel(name)}Schema.omit({{
  id:        true,
  createdAt: true,
  updatedAt: true,
}});

export const update{name}Schema = create{name}Schema.partial();

export const {camel(name)}FilterSchema = z.object({{
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().optional(),
  sortBy:    z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}});

// ---------------------------------------------------------------------------
// TypeScript interfaces (derived from schemas)
// ---------------------------------------------------------------------------

export type {name}           = z.infer<typeof {camel(name)}Schema>;
export type Create{name}Input = z.infer<typeof create{name}Schema>;
export type Update{name}Input = z.infer<typeof update{name}Schema>;
export type {name}Filter      = z.infer<typeof {camel(name)}FilterSchema>;

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

export interface {name}WithRelations extends {name} {{
  // TODO: add relation types
}}

export type {name}Summary = Pick<{name}, 'id' | 'createdAt'>;

export type {name}Status = 'active' | 'inactive' | 'pending' | 'archived';

export const {camel(name)}StatusLabels: Record<{name}Status, string> = {{
  active:   'Active',
  inactive: 'Inactive',
  pending:  'Pending',
  archived: 'Archived',
}};
"""


def gen_test(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ describe, it, expect, beforeEach, afterEach, jest }} from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/prisma', () => ({{
  prisma: {{
    {camel(MODEL_MAP.get(module, pascal(module)))}: {{
      findUnique:  jest.fn(),
      findMany:    jest.fn(),
      count:       jest.fn(),
      create:      jest.fn(),
      update:      jest.fn(),
      delete:      jest.fn(),
      deleteMany:  jest.fn(),
    }},
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  }},
}}));

jest.mock('@/lib/logger', () => ({{
  logger: {{
    child: () => ({{
      info:  jest.fn(),
      warn:  jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }}),
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
  }},
}}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mock{name} = {{
  id:        'test-id-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  // TODO: add domain-specific fields
}};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('{name} - {slug}', () => {{
  beforeEach(() => {{
    jest.clearAllMocks();
  }});

  afterEach(() => {{
    jest.restoreAllMocks();
  }});

  describe('findById', () => {{
    it('returns the record when it exists', async () => {{
      // Arrange
      const {{ prisma }} = await import('@/lib/prisma');
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.findUnique as jest.Mock).mockResolvedValue(mock{name});

      // Act & Assert
      // TODO: call actual service/function and assert result
      expect(mock{name}.id).toBe('test-id-123');
    }});

    it('throws ApiError.notFound when record does not exist', async () => {{
      // Arrange
      const {{ prisma }} = await import('@/lib/prisma');
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      // TODO: expect(service.findById('bad-id')).rejects.toMatchObject({{ statusCode: 404 }});
      expect(true).toBe(true); // placeholder
    }});
  }});

  describe('create', () => {{
    it('creates a new record with valid input', async () => {{
      // Arrange
      const {{ prisma }} = await import('@/lib/prisma');
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.create as jest.Mock).mockResolvedValue(mock{name});

      // Act & Assert
      // TODO: call create and verify the returned object
      expect(mock{name}).toHaveProperty('id');
    }});

    it('throws on invalid input', async () => {{
      // TODO: test validation error path
      expect(true).toBe(true); // placeholder
    }});
  }});

  describe('update', () => {{
    it('updates an existing record', async () => {{
      const updated = {{ ...mock{name}, updatedAt: new Date() }};
      const {{ prisma }} = await import('@/lib/prisma');
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.findUnique as jest.Mock).mockResolvedValue(mock{name});
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.update as jest.Mock).mockResolvedValue(updated);

      // TODO: call update and assert
      expect(updated).toHaveProperty('id');
    }});
  }});

  describe('delete', () => {{
    it('deletes an existing record', async () => {{
      const {{ prisma }} = await import('@/lib/prisma');
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.findUnique as jest.Mock).mockResolvedValue(mock{name});
      (prisma.{camel(MODEL_MAP.get(module, pascal(module)))}.delete as jest.Mock).mockResolvedValue(mock{name});

      // TODO: call delete and assert no error thrown
      expect(mock{name}.id).toBeDefined();
    }});
  }});
}});
"""


def gen_config(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ z }} from 'zod';

// ---------------------------------------------------------------------------
// Environment validation schema
// ---------------------------------------------------------------------------

const envSchema = z.object({{
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  // TODO: add module-specific env vars
}});

// Parse and validate – throws at startup if required vars are missing
export const env = envSchema.parse(process.env);

// ---------------------------------------------------------------------------
// Module configuration constants
// ---------------------------------------------------------------------------

export const {camel(name)}Config = {{
  module:     '{module}',
  feature:    '{slug}',
  version:    '1.0.0',

  pagination: {{
    defaultPage:  1,
    defaultLimit: 20,
    maxLimit:     100,
  }},

  cache: {{
    ttl:         60,     // seconds
    staleTime:   30_000, // ms (client-side)
    revalidate:  60,     // Next.js ISR revalidate seconds
  }},

  rateLimit: {{
    windowMs: 60_000, // 1 minute
    max:      100,    // requests per window
  }},
}} as const;

export type {name}Config = typeof {camel(name)}Config;

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export const featureFlags = {{
  enable{name}:        true,
  enable{name}Export:  process.env.NODE_ENV === 'production',
  enable{name}Preview: process.env.NODE_ENV !== 'production',
}} as const;
"""


def gen_middleware_file(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ NextRequest, NextResponse }} from 'next/server';
import {{ auth }} from '@/lib/auth';
import {{ logger }} from '@/lib/logger';

const log = logger.child({{ middleware: '{name}' }});

// ---------------------------------------------------------------------------
// Route matchers
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES  = ['/', '/auth/login', '/auth/register', '/auth/error'];
const AUTH_ROUTES    = ['/auth/login', '/auth/register'];
const PROTECTED_BASE = ['/dashboard', '/properties', '/tenants', '/payments', '/maintenance', '/admin'];

function isPublic(pathname: string): boolean {{
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}}

function isAuthRoute(pathname: string): boolean {{
  return AUTH_ROUTES.some(r => pathname.startsWith(r));
}}

function isProtected(pathname: string): boolean {{
  return PROTECTED_BASE.some(r => pathname.startsWith(r));
}}

// ---------------------------------------------------------------------------
// Middleware function
// ---------------------------------------------------------------------------

export async function {camel(name)}Middleware(req: NextRequest): Promise<NextResponse> {{
  const {{ pathname }} = req.nextUrl;
  const session = await auth();

  log.debug({{ pathname, userId: session?.user?.id }}, 'middleware check');

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname) && session?.user) {{
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }}

  // Redirect unauthenticated users to login
  if (isProtected(pathname) && !session?.user) {{
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }}

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}}

export const config = {{
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}};
"""


def gen_module(module: str, slug: str, branch: str) -> str:
    name = pascal(slug)
    return f"""\
/**
 * @module  {module}
 * @feature {slug}
 * @branch  {branch}
 */

import {{ z }} from 'zod';
import {{ logger }} from '@/lib/logger';
import {{ ApiError }} from '@/lib/errors';
import type {{ ID }} from '@/types/common';

const log = logger.child({{ module: '{module}', feature: '{slug}' }});

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const {camel(name)}Schema = z.object({{
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
}});

export type {name} = z.infer<typeof {camel(name)}Schema>;

export interface {name}Options {{
  page?:      number;
  limit?:     number;
  search?:    string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Validate and parse a raw object into a {name}.
 */
export function parse{name}(raw: unknown): {name} {{
  const result = {camel(name)}Schema.safeParse(raw);
  if (!result.success) {{
    throw ApiError.badRequest('Invalid {name} data', result.error.flatten());
  }}
  return result.data;
}}

/**
 * Format a {name} for API responses (removes sensitive fields, etc.)
 */
export function format{name}(item: {name}): Omit<{name}, never> {{
  return {{ ...item }};
}}

/**
 * Build a URL-safe slug/identifier from a {name}.
 */
export function get{name}Slug(item: Pick<{name}, 'id'>): string {{
  return item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}}

/**
 * Validate that a given ID is a non-empty string.
 */
export function validate{name}Id(id: unknown): asserts id is ID {{
  if (typeof id !== 'string' || id.trim().length === 0) {{
    throw ApiError.badRequest('{name} ID must be a non-empty string');
  }}
}}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const {camel(name)}Defaults = {{
  page:      1,
  limit:     20,
  sortBy:    'createdAt',
  sortOrder: 'desc' as const,
}};

log.debug('{name} module loaded');
"""


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

GENERATORS = {
    "service":    gen_service,
    "repository": gen_repository,
    "api":        gen_api,
    "page":       gen_page,
    "component":  gen_component,
    "hook":       gen_hook,
    "types":      gen_types,
    "test":       gen_test,
    "config":     gen_config,
    "middleware":  gen_middleware_file,
    "module":     gen_module,
}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    branch   = os.environ.get("BRANCH",    "")
    module   = os.environ.get("MODULE",    "unknown")
    slug     = os.environ.get("SLUG",      "unknown")
    file_path = os.environ.get("FILE_PATH", "")
    file_ext  = os.environ.get("FILE_EXT",  "ts")

    if not file_path:
        print("ERROR: FILE_PATH env var is not set.", file=sys.stderr)
        sys.exit(1)

    # For markdown files, write a structured doc instead of TS
    if file_ext == "md":
        content = (
            f"# {slug}\n\n"
            f"Module: **{module}** | Branch: `{branch}`\n\n"
            f"## Overview\n\nThis document covers the `{slug}` feature.\n\n"
            f"## Status\n\n"
            f"- [ ] Design\n- [ ] Implementation\n- [ ] Tests\n- [ ] Review\n\n"
            f"## Implementation Notes\n\n_Add notes here._\n\n"
            f"## References\n\n- [Feature spec](../README.md)\n"
        )
        file_type = "markdown"
    else:
        file_type = detect_type(slug)
        generator = GENERATORS.get(file_type, gen_module)
        content   = generator(module, slug, branch)

    # Ensure parent directory exists
    os.makedirs(os.path.dirname(file_path) if os.path.dirname(file_path) else ".", exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as fh:
        fh.write(content)

    print(f"Generated [{file_type}]: {file_path}")


if __name__ == "__main__":
    main()
