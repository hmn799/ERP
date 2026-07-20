import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryReversalService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async reverseWarehouseStock(
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
      throw new NotFoundException(
        'Warehouse stock not found.',
      );
    }

    if (Number(stock.quantity) < qty) {
      throw new Error(
        'Cannot reverse more stock than available.',
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

  async reverseStockLedger(
    purchaseBillId: string,
  ) {
    return this.prisma.stockLedger.deleteMany({
      where: {
        referenceType: 'PURCHASE',
        referenceId: purchaseBillId,
      },
    });
  }

  async reversePurchaseLedger(
    purchaseBillId: string,
  ) {
    // Placeholder.
    // We'll replace this with proper ledger reversal
    // when we implement accounting transactions.
    return purchaseBillId;
  }
}