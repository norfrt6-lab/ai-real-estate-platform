/**
 * @module  tenant
 * @feature prisma-model
 * @branch  feat/tenant-prisma-model
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const prismamodelSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export const createPrismaModelSchema = prismamodelSchema.omit({
  id:        true,
  createdAt: true,
  updatedAt: true,
});

export const updatePrismaModelSchema = createPrismaModelSchema.partial();

export const prismamodelFilterSchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().optional(),
  sortBy:    z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---------------------------------------------------------------------------
// TypeScript interfaces (derived from schemas)
// ---------------------------------------------------------------------------

export type PrismaModel           = z.infer<typeof prismamodelSchema>;
export type CreatePrismaModelInput = z.infer<typeof createPrismaModelSchema>;
export type UpdatePrismaModelInput = z.infer<typeof updatePrismaModelSchema>;
export type PrismaModelFilter      = z.infer<typeof prismamodelFilterSchema>;

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

export interface PrismaModelWithRelations extends PrismaModel {
  // TODO: add relation types
}

export type PrismaModelSummary = Pick<PrismaModel, 'id' | 'createdAt'>;

export type PrismaModelStatus = 'active' | 'inactive' | 'pending' | 'archived';

export const prismamodelStatusLabels: Record<PrismaModelStatus, string> = {
  active:   'Active',
  inactive: 'Inactive',
  pending:  'Pending',
  archived: 'Archived',
};
