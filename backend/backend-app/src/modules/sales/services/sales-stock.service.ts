import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesStockService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getCurrentStock(
    itemId: string,
    batchId: string,
    warehouseId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    const stock =
      await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId,
            itemId,
            batchId,
          },
        },
      });

    return stock
      ? Number(stock.quantity)
      : 0;
  }

  // =====================================================
  // GET ALL STOCK FOR A WAREHOUSE
  // =====================================================

  async getWarehouseStocks(
    warehouseId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    if (!warehouseId) {
      throw new BadRequestException(
        'Warehouse ID is required.',
      );
    }

    const stocks =
      await prisma.warehouseStock.findMany({
        where: {
          warehouseId,
        },

        select: {
          batchId: true,
          itemId: true,
          warehouseId: true,
          quantity: true,
        },

        orderBy: {
          batchId: 'asc',
        },
      });

    return stocks.map((stock) => ({
      batchId: stock.batchId,
      itemId: stock.itemId,
      warehouseId: stock.warehouseId,
      quantity: Number(stock.quantity),
    }));
  }

  // =====================================================
  // GET STOCK FOR SPECIFIC BATCHES
  // =====================================================

  async getBatchStocks(
    batchIds: string[],
    warehouseId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    if (
      !batchIds.length ||
      !warehouseId
    ) {
      return [];
    }

    const stocks =
      await prisma.warehouseStock.findMany({
        where: {
          warehouseId,
          batchId: {
            in: batchIds,
          },
        },

        select: {
          batchId: true,
          itemId: true,
          warehouseId: true,
          quantity: true,
        },
      });

    return stocks.map((stock) => ({
      batchId: stock.batchId,
      itemId: stock.itemId,
      warehouseId: stock.warehouseId,
      quantity: Number(stock.quantity),
    }));
  }

  // =====================================================
  // CHECK WHETHER NEGATIVE STOCK IS ALLOWED
  // =====================================================

  async isNegativeStockAllowed(
    prisma: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const setting =
      await prisma.systemSetting.findUnique({
        where: {
          settingKey:
            'ALLOW_NEGATIVE_STOCK',
        },
      });

    if (!setting) {
      return false;
    }

    return (
      setting.value.toLowerCase() ===
      'true'
    );
  }

  // =====================================================
  // REVERSE SALES STOCK
  //
  // Used when an existing sales bill is edited.
  //
  // Original SALE:
  //   quantity -= qty
  //
  // Edit reversal:
  //   quantity += qty
  //
  // The original SALE stock ledger entry is NOT deleted.
  // A separate SALE_EDIT reversal entry is created so
  // the stock history remains auditable.
  // =====================================================

  async reverseStock(
    itemId: string,
    batchId: string,
    warehouseId: string,
    qty: number,
    salesBillId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    if (qty <= 0) {
      throw new BadRequestException(
        'Reverse quantity must be greater than zero.',
      );
    }

    // ===================================================
    // FIND CURRENT WAREHOUSE STOCK
    // ===================================================

    const stock =
      await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId,
            itemId,
            batchId,
          },
        },
      });

    if (!stock) {
      throw new BadRequestException(
        `Warehouse stock not found for item ${itemId}, batch ${batchId}.`,
      );
    }

    // ===================================================
    // RESTORE STOCK
    // ===================================================

    await prisma.warehouseStock.update({
      where: {
        id: stock.id,
      },

      data: {
        quantity: {
          increment: qty,
        },
      },
    });

    // ===================================================
    // STOCK LEDGER REVERSAL
    //
    // Keep the original SALE entry.
    // Record the reversal separately.
    // ===================================================

    await prisma.stockLedger.create({
      data: {
        transactionDate:
          new Date(),

        transactionType:
          'SALE_REVERSAL',

        itemId,

        batchId,

        warehouseId,

        qtyIn: qty,

        qtyOut: 0,

        referenceType:
          'SALE_EDIT',

        referenceId:
          salesBillId,

        remarks:
          'Sales Edit - Stock Reversal',
      },
    });
  }

  // =====================================================
  // POST SALES STOCK
  // =====================================================

  async postStock(
    itemId: string,
    batchId: string,
    warehouseId: string,
    qty: number,
    salesBillId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    if (qty <= 0) {
      throw new BadRequestException(
        'Sales quantity must be greater than zero.',
      );
    }

    // ===================================================
    // CHECK CURRENT STOCK
    // ===================================================

    const currentStock =
      await this.getCurrentStock(
        itemId,
        batchId,
        warehouseId,
        prisma,
      );

    // ===================================================
    // CHECK NEGATIVE STOCK SETTING
    // ===================================================

    const allowNegativeStock =
      await this.isNegativeStockAllowed(
        prisma,
      );

    if (
      !allowNegativeStock &&
      qty > currentStock
    ) {
      throw new BadRequestException(
        `Insufficient stock. Available stock: ${currentStock}. Requested quantity: ${qty}.`,
      );
    }

    // ===================================================
    // UPDATE CURRENT WAREHOUSE STOCK
    // ===================================================

    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_itemId_batchId: {
          warehouseId,
          itemId,
          batchId,
        },
      },

      create: {
        warehouseId,
        itemId,
        batchId,
        quantity: -qty,
      },

      update: {
        quantity: {
          decrement: qty,
        },
      },
    });

    // ===================================================
    // CREATE STOCK LEDGER ENTRY
    // ===================================================

    await prisma.stockLedger.create({
      data: {
        transactionDate: new Date(),

        transactionType: 'SALE',

        itemId,
        batchId,
        warehouseId,

        qtyIn: 0,
        qtyOut: qty,

        referenceType: 'SALE',
        referenceId: salesBillId,

        remarks: 'Sales Entry',
      },
    });
  }
}