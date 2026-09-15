import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

import { PurchaseSaveService } from "./purchase-save.service";
import { InventoryReversalService } from "./inventory-reversal.service";

import { CreatePurchaseDto } from "../dto/create-purchase.dto";

@Injectable()
export class PurchaseEditService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly purchaseSaveService:
      PurchaseSaveService,

    private readonly inventoryReversalService:
      InventoryReversalService,
  ) {}

  async editPurchase(
    purchaseBillId: string,
    dto: CreatePurchaseDto,
  ) {
    return this.prisma.$transaction(
      async (
        tx: Prisma.TransactionClient,
      ) => {
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
        // STATUS
        // =====================================

        if (
          purchase.status ===
          "CANCELLED"
        ) {
          throw new BadRequestException(
            "Cancelled purchase cannot be edited.",
          );
        }

        if (
          purchase.status !==
          "ACTIVE"
        ) {
          throw new BadRequestException(
            `Purchase cannot be edited because its status is ${purchase.status}.`,
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
        // VALIDATE OLD STOCK
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
              "Warehouse stock record not found.",
            );
          }

          if (
            Number(stock.quantity) <
            Number(item.qty)
          ) {
            throw new BadRequestException(
              "Purchase cannot be edited because stock has already been consumed.",
            );
          }
        }

        // =====================================
        // REVERSE OLD STOCK LEDGER
        // =====================================

        await this.inventoryReversalService
          .reverseStockLedger(
            purchase.id,
            tx,
          );

        // =====================================
        // REVERSE OLD PURCHASE LEDGER
        // =====================================

        await this.inventoryReversalService
          .reversePurchaseLedger(
            purchase.id,
            tx,
          );

        // =====================================
        // REVERSE OLD WAREHOUSE STOCK
        // =====================================

        for (
          const item of purchase.items
        ) {
          await this.inventoryReversalService
            .reverseWarehouseStock(
              purchase.warehouseId,

              item.itemId,

              item.batchId,

              Number(item.qty),

              tx,
            );
        }

        // =====================================
        // REVERSE PURCHASE ORDER
        // =====================================

        if (
          purchase.purchaseOrderId
        ) {
          const oldPoItems =
            await tx.purchaseOrderItem.findMany({
              where: {
                purchaseOrderId:
                  purchase.purchaseOrderId,
              },
            });

          for (
            const oldItem of purchase.items
          ) {
            const poItem =
              oldPoItems.find(
                (x) =>
                  x.itemId ===
                  oldItem.itemId,
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
                    oldItem.qty,
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
        // DELETE OLD ITEMS
        // =====================================

        await tx.purchaseBillItem.deleteMany({
          where: {
            purchaseBillId:
              purchase.id,
          },
        });

        // =====================================
        // SAVE UPDATED PURCHASE
        // =====================================

        return this.purchaseSaveService.savePurchase(
          dto,
          purchase.id,
          tx,
        );
      },
    );
  }
}