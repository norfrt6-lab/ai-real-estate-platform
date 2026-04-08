/**
 * @module  tenant
 * @feature background-check-service
 * @branch  feat/tenant-background-check-service
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { Lease } from '@prisma/client';
import type { PaginationParams, ID } from '@/types/common';
import type { PaginatedResult } from '@/types/api';

export interface CreateBackgroundCheckServiceDto {
  // TODO: add creation fields
  [key: string]: unknown;
}

export interface UpdateBackgroundCheckServiceDto {
  // TODO: add update fields
  [key: string]: unknown;
}

export class BackgroundCheckServiceService {
  private readonly log = logger.child({ service: 'BackgroundCheckServiceService' });

  async findById(id: ID): Promise<Lease> {
    this.log.info({ id }, 'findById');
    const record = await prisma.lease.findUnique({ where: { id } });
    if (!record) throw ApiError.notFound('Lease');
    return record;
  }

  async findMany(params: PaginationParams = {}): Promise<PaginatedResult<Lease>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ id: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [data, total] = await prisma.$transaction([
      prisma.lease.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lease.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateBackgroundCheckServiceDto): Promise<Lease> {
    this.log.info({ dto }, 'create');
    return prisma.lease.create({ data: dto as never });
  }

  async update(id: ID, dto: UpdateBackgroundCheckServiceDto): Promise<Lease> {
    this.log.info({ id, dto }, 'update');
    await this.findById(id);
    return prisma.lease.update({ where: { id }, data: dto as never });
  }

  async delete(id: ID): Promise<void> {
    this.log.info({ id }, 'delete');
    await this.findById(id);
    await prisma.lease.delete({ where: { id } });
  }
}

export const backgroundCheckServiceService = new BackgroundCheckServiceService();
