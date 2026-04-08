/**
 * @module  tenant
 * @feature repository
 * @branch  feat/tenant-repository
 */

import { prisma } from '@/lib/prisma';
import type { Lease, Prisma } from '@prisma/client';
import type { ID } from '@/types/common';

export type RepositoryWhere = Prisma.LeaseWhereInput;
export type RepositoryOrderBy = Prisma.LeaseOrderByWithRelationInput;

export const repositoryRepository = {
  findById: async (id: ID): Promise<Lease | null> =>
    prisma.lease.findUnique({ where: { id } }),

  findMany: async (
    where: RepositoryWhere = {},
    orderBy: RepositoryOrderBy = { createdAt: 'desc' },
    skip = 0,
    take = 20,
  ): Promise<Lease[]> =>
    prisma.lease.findMany({ where, orderBy, skip, take }),

  count: async (where: RepositoryWhere = {}): Promise<number> =>
    prisma.lease.count({ where }),

  create: async (data: Prisma.LeaseCreateInput): Promise<Lease> =>
    prisma.lease.create({ data }),

  update: async (id: ID, data: Prisma.LeaseUpdateInput): Promise<Lease> =>
    prisma.lease.update({ where: { id }, data }),

  upsert: async (
    where: Prisma.LeaseWhereUniqueInput,
    create: Prisma.LeaseCreateInput,
    update: Prisma.LeaseUpdateInput,
  ): Promise<Lease> =>
    prisma.lease.upsert({ where, create, update }),

  delete: async (id: ID): Promise<Lease> =>
    prisma.lease.delete({ where: { id } }),

  deleteMany: async (where: RepositoryWhere): Promise<Prisma.BatchPayload> =>
    prisma.lease.deleteMany({ where }),
} as const;

export type RepositoryRepository = typeof repositoryRepository;
