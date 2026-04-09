/**
 * @module  maintenance
 * @feature repository
 * @branch  feat/maintenance-repository
 */

import { prisma } from '@/lib/prisma';
import type { MaintenanceTicket, Prisma } from '@prisma/client';
import type { ID } from '@/types/common';

export type RepositoryWhere = Prisma.MaintenanceTicketWhereInput;
export type RepositoryOrderBy = Prisma.MaintenanceTicketOrderByWithRelationInput;

export const repositoryRepository = {
  findById: async (id: ID): Promise<MaintenanceTicket | null> =>
    prisma.maintenanceticket.findUnique({ where: { id } }),

  findMany: async (
    where: RepositoryWhere = {},
    orderBy: RepositoryOrderBy = { createdAt: 'desc' },
    skip = 0,
    take = 20,
  ): Promise<MaintenanceTicket[]> =>
    prisma.maintenanceticket.findMany({ where, orderBy, skip, take }),

  count: async (where: RepositoryWhere = {}): Promise<number> =>
    prisma.maintenanceticket.count({ where }),

  create: async (data: Prisma.MaintenanceTicketCreateInput): Promise<MaintenanceTicket> =>
    prisma.maintenanceticket.create({ data }),

  update: async (id: ID, data: Prisma.MaintenanceTicketUpdateInput): Promise<MaintenanceTicket> =>
    prisma.maintenanceticket.update({ where: { id }, data }),

  upsert: async (
    where: Prisma.MaintenanceTicketWhereUniqueInput,
    create: Prisma.MaintenanceTicketCreateInput,
    update: Prisma.MaintenanceTicketUpdateInput,
  ): Promise<MaintenanceTicket> =>
    prisma.maintenanceticket.upsert({ where, create, update }),

  delete: async (id: ID): Promise<MaintenanceTicket> =>
    prisma.maintenanceticket.delete({ where: { id } }),

  deleteMany: async (where: RepositoryWhere): Promise<Prisma.BatchPayload> =>
    prisma.maintenanceticket.deleteMany({ where }),
} as const;

export type RepositoryRepository = typeof repositoryRepository;
