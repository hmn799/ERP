import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { QueryAuditLogDto } from './dto/query-audit-log.dto';

export interface AuditActor {
  id?: string | null;
  name?: string | null;
}

export interface RecordAuditEventInput {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

type AuditClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * Never allowed to break the operation it is auditing - a failed
   * audit write is logged to the console rather than rethrown.
   */
  async record(
    client: AuditClient,
    data: RecordAuditEventInput,
  ) {
    try {
      await client.auditLog.create({
        data: {
          actorId: data.actorId ?? null,
          actorName: data.actorName ?? null,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId ?? null,
          details: (data.details ?? undefined) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error('Failed to record audit event', error);
    }
  }

  async findAll(query: QueryAuditLogDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where: Prisma.AuditLogWhereInput = {
      entityType: query.entityType || undefined,
      action: query.action || undefined,
      actorId: query.actorId || undefined,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom
                ? new Date(query.dateFrom)
                : undefined,
              lte: query.dateTo
                ? new Date(query.dateTo)
                : undefined,
            }
          : undefined,
    };

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async distinctActions() {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });

    return rows.map((row) => row.action);
  }
}
