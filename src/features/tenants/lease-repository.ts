/**
 * @module  tenant
 * @feature lease-repository
 * @branch  feat/tenant-lease-repository
 */

import { prisma } from '@/lib/prisma';
import type { Lease, Prisma } from '@prisma/client';
import type { ID } from '@/types/common';

export type LeaseRepositoryWhere = Prisma.LeaseWhereInput;
export type LeaseRepositoryOrderBy = Prisma.LeaseOrderByWithRelationInput;

export const leaseRepositoryRepository = {
  findById: async (id: ID): Promise<Lease | null> =>
    prisma.lease.findUnique({ where: { id } }),

  findMany: async (
    where: LeaseRepositoryWhere = {},
    orderBy: LeaseRepositoryOrderBy = { createdAt: 'desc' },
    skip = 0,
    take = 20,
  ): Promise<Lease[]> =>
    prisma.lease.findMany({ where, orderBy, skip, take }),

  count: async (where: LeaseRepositoryWhere = {}): Promise<number> =>
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

  deleteMany: async (where: LeaseRepositoryWhere): Promise<Prisma.BatchPayload> =>
    prisma.lease.deleteMany({ where }),
} as const;

export type LeaseRepositoryRepository = typeof leaseRepositoryRepository;
