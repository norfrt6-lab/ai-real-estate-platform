/**
 * @module  maintenance
 * @feature service
 * @branch  feat/maintenance-service
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { MaintenanceTicket } from '@prisma/client';
import type { PaginationParams, ID } from '@/types/common';
import type { PaginatedResult } from '@/types/api';

export interface CreateServiceDto {
  // TODO: add creation fields
  [key: string]: unknown;
}

export interface UpdateServiceDto {
  // TODO: add update fields
  [key: string]: unknown;
}

export class ServiceService {
  private readonly log = logger.child({ service: 'ServiceService' });

  async findById(id: ID): Promise<MaintenanceTicket> {
    this.log.info({ id }, 'findById');
    const record = await prisma.maintenanceticket.findUnique({ where: { id } });
    if (!record) throw ApiError.notFound('MaintenanceTicket');
    return record;
  }

  async findMany(params: PaginationParams = {}): Promise<PaginatedResult<MaintenanceTicket>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ id: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [data, total] = await prisma.$transaction([
      prisma.maintenanceticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.maintenanceticket.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateServiceDto): Promise<MaintenanceTicket> {
    this.log.info({ dto }, 'create');
    return prisma.maintenanceticket.create({ data: dto as never });
  }

  async update(id: ID, dto: UpdateServiceDto): Promise<MaintenanceTicket> {
    this.log.info({ id, dto }, 'update');
    await this.findById(id);
    return prisma.maintenanceticket.update({ where: { id }, data: dto as never });
  }

  async delete(id: ID): Promise<void> {
    this.log.info({ id }, 'delete');
    await this.findById(id);
    await prisma.maintenanceticket.delete({ where: { id } });
  }
}

export const serviceService = new ServiceService();
