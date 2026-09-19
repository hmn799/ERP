import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { FulfillSalesOrderDto } from './dto/fulfill-sales-order.dto';

import { SalesOrderSaveService } from './services/sales-order-save.service';
import { SalesOrderFulfillService } from './services/sales-order-fulfill.service';
import { AuditActor } from '../audit/audit.service';

@Injectable()
export class SalesOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saveService: SalesOrderSaveService,
    private readonly fulfillService: SalesOrderFulfillService,
  ) {}

  async create(dto: CreateSalesOrderDto) {
    return this.saveService.create(dto);
  }

  async findAll() {
    return this.prisma.salesOrder.findMany({
      include: {
        customer: true,
        warehouse: true,
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: true,
        items: {
          include: {
            item: true,
          },
        },
        salesBills: true,
      },
    });
  }

  async fulfill(
    id: string,
    dto: FulfillSalesOrderDto,
    permissions: string[] = [],
    actor?: AuditActor,
  ) {
    return this.fulfillService.fulfill(id, dto, permissions, actor);
  }

  async cancel(id: string) {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales Order not found.');
    }

    if (salesOrder.status === 'CANCELLED') {
      throw new BadRequestException('Sales Order already cancelled.');
    }

    if (salesOrder.status !== 'PENDING') {
      throw new BadRequestException(
        'Cannot cancel a Sales Order that has already been fulfilled.',
      );
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
