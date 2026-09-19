import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { SalesService } from '../../sales/sales.service';
import { CreateSalesDto } from '../../sales/dto/create-sales.dto';
import { CreateSalesItemDto } from '../../sales/dto/create-sales-item.dto';

import { FulfillSalesOrderDto } from '../dto/fulfill-sales-order.dto';
import { AuditActor } from '../../audit/audit.service';

@Injectable()
export class SalesOrderFulfillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
  ) {}

  async fulfill(
    salesOrderId: string,
    dto: FulfillSalesOrderDto,
    permissions: string[] = [],
    actor?: AuditActor,
  ) {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        customer: true,
        warehouse: true,
        items: { include: { item: true } },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales Order not found.');
    }

    if (salesOrder.status === 'COMPLETED') {
      throw new BadRequestException('Sales Order already completed.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No items to fulfill.');
    }

    const salesItems: CreateSalesItemDto[] = [];

    for (const line of dto.items) {
      const soItem = salesOrder.items.find(
        (x) => x.id === line.salesOrderItemId,
      );

      if (!soItem) {
        throw new BadRequestException('Sales Order item not found.');
      }

      const pending = Number(soItem.pendingQty);

      if (line.qty <= 0) {
        throw new BadRequestException('Invalid fulfil quantity.');
      }

      if (line.qty > pending) {
        throw new BadRequestException(
          `Fulfil quantity exceeds pending quantity for ${soItem.item.name}.`,
        );
      }

      salesItems.push({
        itemId: soItem.itemId,
        batchId: line.batchId,
        qty: line.qty,
        discountPercent: Number(soItem.discountPercent),
        gstPercent: Number(soItem.gstPercent),
        saleRate: Number(soItem.saleRate),
      });
    }

    // billNo is intentionally omitted - saveSales() always
    // auto-generates it via DocumentNumberService regardless of
    // what's passed here.
    const salesDto = {
      billDate: dto.billDate ?? new Date().toISOString(),
      customerId: salesOrder.customerId ?? undefined,
      warehouseId: salesOrder.warehouseId,
      isCredit: Boolean(salesOrder.customerId),
      items: salesItems,
    } as CreateSalesDto;

    const salesBill = await this.salesService.create(
      salesDto,
      permissions,
      actor,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.salesBill.update({
        where: { id: (salesBill as { id: string }).id },
        data: { salesOrderId: salesOrder.id },
      });

      for (const line of dto.items) {
        await tx.salesOrderItem.update({
          where: { id: line.salesOrderItemId },
          data: {
            qtyDelivered: { increment: line.qty },
            pendingQty: { decrement: line.qty },
          },
        });
      }

      const remaining = await tx.salesOrderItem.count({
        where: {
          salesOrderId: salesOrder.id,
          pendingQty: { gt: 0 },
        },
      });

      await tx.salesOrder.update({
        where: { id: salesOrder.id },
        data: {
          status: remaining > 0 ? 'PARTIAL' : 'COMPLETED',
        },
      });

      return {
        message: 'Sales Order fulfilled successfully.',
        salesBill,
      };
    });
  }
}
