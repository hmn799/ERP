import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

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
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

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
        "Warehouse stock not found.",
      );
    }

    if (
      Number(stock.quantity) <
      qty
    ) {
      throw new Error(
        "Cannot reverse more stock than available.",
      );
    }

    return db.warehouseStock.update({
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
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

    return db.stockLedger.deleteMany({
      where: {
        referenceId:
          purchaseBillId,

        referenceType:
          "PURCHASE",
      },
    });
  }

  async reversePurchaseLedger(
    purchaseBillId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db =
      tx ?? this.prisma;

    return db.ledgerEntry.deleteMany({
      where: {
        referenceId:
          purchaseBillId,

        referenceType:
          "PURCHASE",

        transactionType:
          "PURCHASE",
      },
    });
  }
}