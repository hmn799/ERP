import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesStockService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getCurrentStock(
    itemId: string,
    batchId: string,
    warehouseId: string,
  ) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          itemId,
          batchId,
          warehouseId,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const entry of entries) {
      qtyIn += Number(entry.qtyIn);
      qtyOut += Number(entry.qtyOut);
    }

    return qtyIn - qtyOut;
  }

  async postStock(
    itemId: string,
    batchId: string,
    warehouseId: string,
    qty: number,
    salesBillId: string,
  ) {
    await this.prisma.stockLedger.create({
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