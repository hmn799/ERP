import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchaseStockService {
  constructor(private prisma: PrismaService) {}

  async createOrGetBatch(
    itemId: string,
    batchNo: string,
    purchaseRate: number,
    retailRate: number,
    wholesaleRate: number,
    distributorRate: number,
    mrp: number,
    expiryDate?: Date,
    barcode?: string,
  ) {
    console.log('====================');
    console.log('BATCH DEBUG');
    console.log('RAW itemId =', itemId);
    console.log('TYPE =', typeof itemId);
    console.log('LENGTH =', itemId?.length);

    const cleanItemId = itemId?.trim();

    console.log('CLEAN itemId =', cleanItemId);

    const allItems = await this.prisma.item.findMany();

console.log('====================');
console.log('ALL ITEMS IN DATABASE');
console.log(JSON.stringify(allItems, null, 2));
console.log('====================');

    const itemExists = await this.prisma.item.findUnique({
      where: {
        id: cleanItemId,
      },
    });

    console.log('ITEM EXISTS');
    console.log(itemExists);

    if (!itemExists) {
      throw new Error(
        `Item not found. Received itemId = ${cleanItemId}`,
      );
    }

    console.log('batchNo =', batchNo);
    console.log('====================');

    let batch = await this.prisma.batch.findFirst({
      where: {
        itemId: cleanItemId,
        batchNo,
      },
    });

    if (!batch) {
      batch = await this.prisma.batch.create({
        data: {
          itemId: cleanItemId,
          batchNo,
          purchaseRate,
          retailRate,
          wholesaleRate,
          distributorRate,
          mrp,
          expiryDate,
          barcode,
        },
      });
    }

    return batch;
  }

  async postStock(
    itemId: string,
    batchId: string,
    warehouseId: string,
    qty: number,
    purchaseBillId: string,
  ) {
    await this.prisma.stockLedger.create({
      data: {
        transactionDate: new Date(),
        transactionType: 'PURCHASE',

        itemId,
        batchId,
        warehouseId,

        qtyIn: qty,
        qtyOut: 0,

        referenceType: 'PURCHASE',
        referenceId: purchaseBillId,

        remarks: 'Purchase Entry',
      },
    });
  }
}