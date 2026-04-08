/**
 * @module  tenant
 * @feature lease-prisma-model
 * @branch  feat/tenant-lease-prisma-model
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const leaseprismamodelSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export const createLeasePrismaModelSchema = leaseprismamodelSchema.omit({
  id:        true,
  createdAt: true,
  updatedAt: true,
});

export const updateLeasePrismaModelSchema = createLeasePrismaModelSchema.partial();

export const leaseprismamodelFilterSchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().optional(),
  sortBy:    z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---------------------------------------------------------------------------
// TypeScript interfaces (derived from schemas)
// ---------------------------------------------------------------------------

export type LeasePrismaModel           = z.infer<typeof leaseprismamodelSchema>;
export type CreateLeasePrismaModelInput = z.infer<typeof createLeasePrismaModelSchema>;
export type UpdateLeasePrismaModelInput = z.infer<typeof updateLeasePrismaModelSchema>;
export type LeasePrismaModelFilter      = z.infer<typeof leaseprismamodelFilterSchema>;

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

export interface LeasePrismaModelWithRelations extends LeasePrismaModel {
  // TODO: add relation types
}

export type LeasePrismaModelSummary = Pick<LeasePrismaModel, 'id' | 'createdAt'>;

export type LeasePrismaModelStatus = 'active' | 'inactive' | 'pending' | 'archived';

export const leaseprismamodelStatusLabels: Record<LeasePrismaModelStatus, string> = {
  active:   'Active',
  inactive: 'Inactive',
  pending:  'Pending',
  archived: 'Archived',
};
