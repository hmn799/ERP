import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesReversalService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================
  // REVERSE WAREHOUSE STOCK
  //
  // A SALE originally decreases stock.
  // Reversing the sale therefore increases stock.
  // =========================================================

  async reverseWarehouseStock(
    warehouseId: string,
    itemId: string,
    batchId: string,
    qty: number,
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

    if (qty <= 0) {
      throw new Error(
        'Reversal quantity must be greater than zero.',
      );
    }

    const stock =
      await db.warehouseStock.findUnique({
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
        'Warehouse stock not found while reversing sales.',
      );
    }

    return db.warehouseStock.update({
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

  // =========================================================
  // REVERSE SALES STOCK LEDGER
  //
  // Current Sales creation creates stock ledger entries:
  //
  // transactionType = SALE
  // referenceType   = SALE
  // referenceId     = salesBillId
  //
  // Remove only entries belonging to this sale.
  // =========================================================

  async reverseStockLedger(
    salesBillId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

    return db.stockLedger.deleteMany({
      where: {
        referenceId:
          salesBillId,

        referenceType:
          'SALE',

        transactionType:
          'SALE',
      },
    });
  }

  // =========================================================
  // REVERSE SALES CUSTOMER LEDGER
  //
  // Current Sales creation posts:
  //
  // transactionType = SALE
  // referenceType   = SALE
  // referenceId     = salesBillId
  //
  // Remove only the ledger entry belonging to this sale.
  // =========================================================

  async reverseSalesLedger(
    salesBillId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

    return db.ledgerEntry.deleteMany({
      where: {
        referenceId:
          salesBillId,

        referenceType:
          'SALE',

        transactionType:
          'SALE',
      },
    });
  }

  // =========================================================
  // REVERSE SALES PAYMENTS
  //
  // Payments belong directly to SalesBill.
  // They will be recreated using the edited payment data.
  // =========================================================

  async reversePayments(
    salesBillId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

    return db.salesPayment.deleteMany({
      where: {
        salesBillId,
      },
    });
  }
}