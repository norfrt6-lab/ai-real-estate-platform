/**
 * @module  maintenance
 * @feature types-interfaces
 * @branch  feat/maintenance-types-interfaces
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const typesinterfacesSchema = z.object({
  id:        z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // TODO: add domain-specific fields
});

export const createTypesInterfacesSchema = typesinterfacesSchema.omit({
  id:        true,
  createdAt: true,
  updatedAt: true,
});

export const updateTypesInterfacesSchema = createTypesInterfacesSchema.partial();

export const typesinterfacesFilterSchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().optional(),
  sortBy:    z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---------------------------------------------------------------------------
// TypeScript interfaces (derived from schemas)
// ---------------------------------------------------------------------------

export type TypesInterfaces           = z.infer<typeof typesinterfacesSchema>;
export type CreateTypesInterfacesInput = z.infer<typeof createTypesInterfacesSchema>;
export type UpdateTypesInterfacesInput = z.infer<typeof updateTypesInterfacesSchema>;
export type TypesInterfacesFilter      = z.infer<typeof typesinterfacesFilterSchema>;

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

export interface TypesInterfacesWithRelations extends TypesInterfaces {
  // TODO: add relation types
}

export type TypesInterfacesSummary = Pick<TypesInterfaces, 'id' | 'createdAt'>;

export type TypesInterfacesStatus = 'active' | 'inactive' | 'pending' | 'archived';

export const typesinterfacesStatusLabels: Record<TypesInterfacesStatus, string> = {
  active:   'Active',
  inactive: 'Inactive',
  pending:  'Pending',
  archived: 'Archived',
};
