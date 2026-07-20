import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchaseStockService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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