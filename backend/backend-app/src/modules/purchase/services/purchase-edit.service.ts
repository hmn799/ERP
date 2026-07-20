import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { PurchaseSaveService } from './purchase-save.service';
import { InventoryReversalService } from './inventory-reversal.service';

import { CreatePurchaseDto } from '../dto/create-purchase.dto';

@Injectable()
export class PurchaseEditService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly purchaseSaveService: PurchaseSaveService,

    private readonly inventoryReversalService: InventoryReversalService,
  ) {}

  async editPurchase(
  purchaseBillId: string,
  dto: CreatePurchaseDto,
) {
  const purchase =
    await this.prisma.purchaseBill.findUnique({
      where: {
        id: purchaseBillId,
      },
      include: {
        items: true,
      },
    });

  if (!purchase) {
    throw new NotFoundException(
      'Purchase not found.',
    );
  }

  if (purchase.items.length === 0) {
    throw new BadRequestException(
      'Purchase contains no items.',
    );
  }

  // =====================================
  // VALIDATE EDIT IS ALLOWED
  // =====================================

  for (const item of purchase.items) {
    const stock =
      await this.prisma.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId: purchase.warehouseId,
            itemId: item.itemId,
            batchId: item.batchId,
          },
        },
      });

    if (!stock) {
      throw new BadRequestException(
        'Warehouse stock record not found.',
      );
    }

    if (Number(stock.quantity) < Number(item.qty)) {
      throw new BadRequestException(
        'Purchase cannot be edited because stock has already been consumed.',
      );
    }
  }

  // =====================================
  // REVERSE STOCK LEDGER
  // =====================================

  await this.inventoryReversalService.reverseStockLedger(
    purchase.id,
  );

  // =====================================
  // REVERSE WAREHOUSE STOCK
  // =====================================

  for (const item of purchase.items) {
    await this.inventoryReversalService.reverseWarehouseStock(
      purchase.warehouseId,
      item.itemId,
      item.batchId,
      Number(item.qty),
    );
  }

  // =====================================
  // DELETE PURCHASE ITEMS
  // =====================================

  await this.prisma.purchaseBillItem.deleteMany({
    where: {
      purchaseBillId: purchase.id,
    },
  });

  // =====================================
  // SAVE AGAIN
  // =====================================

  return this.purchaseSaveService.savePurchase(
    dto,
    purchase.id,
  );
}
}