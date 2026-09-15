import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PurchaseCancellationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async cancelPurchase(
    purchaseBillId: string,
  ) {
    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // =====================================
        // FIND PURCHASE
        // =====================================

        const purchase =
          await tx.purchaseBill.findUnique({
            where: {
              id: purchaseBillId,
            },

            include: {
              items: true,
            },
          });

        if (!purchase) {
          throw new NotFoundException(
            "Purchase not found.",
          );
        }

        // =====================================
        // STATUS VALIDATION
        // =====================================

        if (
          purchase.status === "CANCELLED"
        ) {
          throw new BadRequestException(
            "Purchase is already cancelled.",
          );
        }

        if (
          purchase.status !== "ACTIVE"
        ) {
          throw new BadRequestException(
            `Purchase cannot be cancelled because its status is ${purchase.status}.`,
          );
        }

        if (
          purchase.items.length === 0
        ) {
          throw new BadRequestException(
            "Purchase contains no items.",
          );
        }

        // =====================================
        // CHECK STOCK
        // =====================================

        for (
          const item of purchase.items
        ) {
          const stock =
            await tx.warehouseStock.findUnique({
              where: {
                warehouseId_itemId_batchId: {
                  warehouseId:
                    purchase.warehouseId,

                  itemId:
                    item.itemId,

                  batchId:
                    item.batchId,
                },
              },
            });

          if (!stock) {
            throw new BadRequestException(
              `Warehouse stock not found for item ${item.itemId}.`,
            );
          }

          if (
            Number(stock.quantity) <
            Number(item.qty)
          ) {
            throw new BadRequestException(
              `Purchase ${purchase.billNo} cannot be cancelled because stock for item ${item.itemId} has already been consumed.`,
            );
          }
        }

        // =====================================
        // REVERSE WAREHOUSE STOCK
        // =====================================

        for (
          const item of purchase.items
        ) {
          await tx.warehouseStock.update({
            where: {
              warehouseId_itemId_batchId: {
                warehouseId:
                  purchase.warehouseId,

                itemId:
                  item.itemId,

                batchId:
                  item.batchId,
              },
            },

            data: {
              quantity: {
                decrement: Number(
                  item.qty,
                ),
              },
            },
          });
        }

        // =====================================
        // POST STOCK REVERSAL
        // =====================================

        for (
          const item of purchase.items
        ) {
          await tx.stockLedger.create({
            data: {
              transactionDate:
                new Date(),

              transactionType:
                "PURCHASE_CANCEL",

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              warehouseId:
                purchase.warehouseId,

              qtyIn: 0,

              qtyOut:
                Number(item.qty),

              referenceType:
                "PURCHASE_CANCEL",

              referenceId:
                purchase.id,

              remarks:
                `Cancellation of Purchase ${purchase.billNo}`,
            },
          });
        }

        // =====================================
        // REVERSE SUPPLIER LEDGER
        // =====================================

        await tx.ledgerEntry.create({
          data: {
            transactionDate:
              new Date(),

            partyType:
              "SUPPLIER",

            partyId:
              purchase.supplierId,

            transactionType:
              "PURCHASE_CANCEL",

            referenceType:
              "PURCHASE_CANCEL",

            referenceId:
              purchase.id,

            debitAmount:
              Number(
                purchase.netAmount,
              ),

            creditAmount: 0,

            remarks:
              `Cancellation of Purchase ${purchase.billNo}`,
          },
        });

        // =====================================
        // REVERSE PURCHASE ORDER
        // =====================================

        if (
          purchase.purchaseOrderId
        ) {
          const poItems =
            await tx.purchaseOrderItem.findMany({
              where: {
                purchaseOrderId:
                  purchase.purchaseOrderId,
              },
            });

          for (
            const purchaseItem of
            purchase.items
          ) {
            const poItem =
              poItems.find(
                (item) =>
                  item.itemId ===
                  purchaseItem.itemId,
              );

            if (!poItem) {
              continue;
            }

            const qtyReceived =
              Math.max(
                0,
                Number(
                  poItem.qtyReceived,
                ) -
                  Number(
                    purchaseItem.qty,
                  ),
              );

            const pendingQty =
              Math.max(
                0,
                Number(
                  poItem.qtyOrdered,
                ) -
                  qtyReceived,
              );

            await tx.purchaseOrderItem.update({
              where: {
                id: poItem.id,
              },

              data: {
                qtyReceived,

                pendingQty,
              },
            });
          }

          const remaining =
            await tx.purchaseOrderItem.count({
              where: {
                purchaseOrderId:
                  purchase.purchaseOrderId,

                pendingQty: {
                  gt: 0,
                },
              },
            });

          await tx.purchaseOrder.update({
            where: {
              id:
                purchase.purchaseOrderId,
            },

            data: {
              status:
                remaining > 0
                  ? "PARTIAL"
                  : "COMPLETED",
            },
          });
        }

        // =====================================
        // MARK PURCHASE CANCELLED
        // =====================================

        const cancelledPurchase =
          await tx.purchaseBill.update({
            where: {
              id: purchase.id,
            },

            data: {
              status: "CANCELLED",
            },
          });

        return {
          success: true,

          message:
            "Purchase cancelled successfully.",

          purchase:
            cancelledPurchase,
        };
      },
    );
  }
}