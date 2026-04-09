/**
 * @module  ai
 * @feature maintenance-triage-service
 * @branch  feat/ai-maintenance-triage-service
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { Ai } from '@prisma/client';
import type { PaginationParams, ID } from '@/types/common';
import type { PaginatedResult } from '@/types/api';

export interface CreateMaintenanceTriageServiceDto {
  // TODO: add creation fields
  [key: string]: unknown;
}

export interface UpdateMaintenanceTriageServiceDto {
  // TODO: add update fields
  [key: string]: unknown;
}

export class MaintenanceTriageServiceService {
  private readonly log = logger.child({ service: 'MaintenanceTriageServiceService' });

  async findById(id: ID): Promise<Ai> {
    this.log.info({ id }, 'findById');
    const record = await prisma.ai.findUnique({ where: { id } });
    if (!record) throw ApiError.notFound('Ai');
    return record;
  }

  async findMany(params: PaginationParams = {}): Promise<PaginatedResult<Ai>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ id: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [data, total] = await prisma.$transaction([
      prisma.ai.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.ai.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateMaintenanceTriageServiceDto): Promise<Ai> {
    this.log.info({ dto }, 'create');
    return prisma.ai.create({ data: dto as never });
  }

  async update(id: ID, dto: UpdateMaintenanceTriageServiceDto): Promise<Ai> {
    this.log.info({ id, dto }, 'update');
    await this.findById(id);
    return prisma.ai.update({ where: { id }, data: dto as never });
  }

  async delete(id: ID): Promise<void> {
    this.log.info({ id }, 'delete');
    await this.findById(id);
    await prisma.ai.delete({ where: { id } });
  }
}

export const maintenanceTriageServiceService = new MaintenanceTriageServiceService();
