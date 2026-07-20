import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehouseStockService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async increaseStock(
    warehouseId: string,
    itemId: string,
    batchId: string,
    qty: number,
  ) {
    const stock =
      await this.prisma.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId,
            itemId,
            batchId,
          },
        },
      });

    if (!stock) {
      return this.prisma.warehouseStock.create({
        data: {
          warehouseId,
          itemId,
          batchId,
          quantity: qty,
        },
      });
    }

    return this.prisma.warehouseStock.update({
      where: {
        id: stock.id,
      },
      data: {
        quantity: {
          increment: qty,
        },
      },
    });
  }

  async decreaseStock(
    warehouseId: string,
    itemId: string,
    batchId: string,
    qty: number,
  ) {
    const stock =
      await this.prisma.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId,
            itemId,
            batchId,
          },
        },
      });

    if (!stock) {
      throw new Error(
        'Warehouse stock not found.',
      );
    }

    if (Number(stock.quantity) < qty) {
      throw new Error(
        'Insufficient stock.',
      );
    }

    return this.prisma.warehouseStock.update({
      where: {
        id: stock.id,
      },
      data: {
        quantity: {
          decrement: qty,
        },
      },
    });
  }

  async getStock(
    warehouseId: string,
    itemId: string,
    batchId: string,
  ) {
    return this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_itemId_batchId: {
          warehouseId,
          itemId,
          batchId,
        },
      },
    });
  }

  async getItemStock(
    warehouseId: string,
    itemId: string,
  ) {
    return this.prisma.warehouseStock.findMany({
      where: {
        warehouseId,
        itemId,
      },
      include: {
        batch: true,
      },
      orderBy: {
        batch: {
          expiryDate: 'asc',
        },
      },
    });
  }
}