import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";

import { CreatePurchaseReturnDto } from "./dto/create-purchase-return.dto";

import { DocumentNumberService } from "../../core/document-number/document-number.service";
import { DocumentType } from "../../core/document-number/document-type.enum";

import { AuditService, AuditActor } from "../audit/audit.service";

@Injectable()
export class PurchaseReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly documentNumberService: DocumentNumberService,
    private readonly auditService: AuditService,
  ) {}

  // =========================================================
  // CREATE PURCHASE RETURN
  // =========================================================

  async create(dto: CreatePurchaseReturnDto) {
    if (!dto.supplierId) {
      throw new BadRequestException(
        "Supplier is required.",
      );
    }

    if (!dto.warehouseId) {
      throw new BadRequestException(
        "Warehouse is required.",
      );
    }

    if (!dto.purchaseBillId) {
      throw new BadRequestException(
        "Purchase bill is required.",
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "At least one return item is required.",
      );
    }

    const supplierId = dto.supplierId;
    const warehouseId = dto.warehouseId;
    const purchaseBillId = dto.purchaseBillId;

    const returnNo =
      dto.returnNo?.trim() ||
      await this.documentNumberService.next(
        DocumentType.PURCHASE_RETURN,
      );

    return this.prisma.$transaction(
      async (tx) => {
        const purchaseBill =
          await tx.purchaseBill.findUnique({
            where: {
              id: purchaseBillId,
            },

            include: {
              items: true,
            },
          });

        if (!purchaseBill) {
          throw new NotFoundException(
            "Purchase bill not found.",
          );
        }

        await this.validateReturnItems(
          tx,
          purchaseBillId,
          dto.items,
        );

        const totals =
          this.calculateTotals(
            dto.items,
          );

        const purchaseReturn =
          await tx.purchaseReturn.create({
            data: {
              returnNo,

              returnDate:
                dto.returnDate,

              status:
                "ACTIVE",

              purchaseBillId,

              supplierId,

              warehouseId,

              grossAmount:
                totals.grossAmount,

              taxableAmount:
                totals.taxableAmount,

              cgstAmount:
                totals.cgstAmount,

              sgstAmount:
                totals.sgstAmount,

              igstAmount:
                totals.igstAmount,

              netAmount:
                totals.netAmount,
            },
          });

        for (const item of dto.items) {
          const qty =
            Number(item.qty);

          await this.applyStockOut(
            tx,
            warehouseId,
            item.itemId,
            item.batchId,
            qty,
          );

          const calculation =
            this.calculateItem(
              qty,
              item.purchaseRate,
              item.gstPercent,
            );

          await tx.purchaseReturnItem.create({
            data: {
              purchaseReturnId:
                purchaseReturn.id,

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              qty,

              purchaseRate:
                item.purchaseRate,

              gstPercent:
                item.gstPercent,

              taxableAmount:
                calculation.taxableAmount,

              cgstAmount:
                calculation.cgstAmount,

              sgstAmount:
                calculation.sgstAmount,

              igstAmount:
                calculation.igstAmount,

              netAmount:
                calculation.netAmount,
            },
          });

          await tx.stockLedger.create({
            data: {
              transactionDate:
                new Date(),

              transactionType:
                "PURCHASE_RETURN",

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              warehouseId,

              qtyIn: 0,

              qtyOut:
                qty,

              referenceType:
                "PURCHASE_RETURN",

              referenceId:
                purchaseReturn.id,

              remarks:
                "Purchase Return",
            },
          });
        }

        await this.ledgerService.postPurchaseReturn(
          supplierId,
          totals.netAmount,
          purchaseReturn.id,
          tx,
        );

        return purchaseReturn;
      },
    ).then((result) =>
      this.findOne(result.id),
    );
  }

  // =========================================================
  // EDIT PURCHASE RETURN
  // =========================================================

  async update(
    id: string,
    dto: CreatePurchaseReturnDto,
  ) {
    if (!dto.supplierId) {
      throw new BadRequestException(
        "Supplier is required.",
      );
    }

    if (!dto.warehouseId) {
      throw new BadRequestException(
        "Warehouse is required.",
      );
    }

    if (!dto.purchaseBillId) {
      throw new BadRequestException(
        "Purchase bill is required.",
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "At least one return item is required.",
      );
    }

    const supplierId = dto.supplierId;
    const warehouseId = dto.warehouseId;
    const purchaseBillId = dto.purchaseBillId;

    return this.prisma.$transaction(
      async (tx) => {
        const existing =
          await tx.purchaseReturn.findUnique({
            where: {
              id,
            },

            include: {
              items: true,
            },
          });

        if (!existing) {
          throw new NotFoundException(
            "Purchase return not found.",
          );
        }

        if (
          existing.status !==
          "ACTIVE"
        ) {
          throw new BadRequestException(
            "Only an ACTIVE purchase return can be edited.",
          );
        }

        const purchaseBill =
          await tx.purchaseBill.findUnique({
            where: {
              id: purchaseBillId,
            },

            include: {
              items: true,
            },
          });

        if (!purchaseBill) {
          throw new NotFoundException(
            "Purchase bill not found.",
          );
        }

        // -----------------------------------------------------
        // REVERSE OLD STOCK
        // -----------------------------------------------------

        for (
          const oldItem of
          existing.items
        ) {
          const oldQty =
            Number(oldItem.qty);

          await this.applyStockIn(
            tx,
            existing.warehouseId,
            oldItem.itemId,
            oldItem.batchId,
            oldQty,
          );

          await tx.stockLedger.create({
            data: {
              transactionDate:
                new Date(),

              transactionType:
                "PURCHASE_RETURN_EDIT_REVERSAL",

              itemId:
                oldItem.itemId,

              batchId:
                oldItem.batchId,

              warehouseId:
                existing.warehouseId,

              qtyIn:
                oldQty,

              qtyOut: 0,

              referenceType:
                "PURCHASE_RETURN",

              referenceId:
                existing.id,

              remarks:
                "Purchase Return Edit - Stock Reversal",
            },
          });
        }

        // -----------------------------------------------------
        // REVERSE OLD SUPPLIER LEDGER
        // -----------------------------------------------------

        await tx.ledgerEntry.create({
          data: {
            transactionDate:
              new Date(),

            partyType:
              "SUPPLIER",

            partyId:
              existing.supplierId,

            transactionType:
              "PURCHASE_RETURN_EDIT_REVERSAL",

            referenceType:
              "PURCHASE_RETURN",

            referenceId:
              existing.id,

            debitAmount: 0,

            creditAmount:
              Number(
                existing.netAmount,
              ),

            remarks:
              "Purchase Return Edit - Ledger Reversal",
          },
        });

        // -----------------------------------------------------
        // DELETE OLD RETURN ITEMS
        // -----------------------------------------------------

        await tx.purchaseReturnItem.deleteMany({
          where: {
            purchaseReturnId:
              existing.id,
          },
        });

        // -----------------------------------------------------
        // VALIDATE NEW ITEMS
        // -----------------------------------------------------

        await this.validateReturnItems(
          tx,
          purchaseBillId,
          dto.items,
          id,
        );

        const totals =
          this.calculateTotals(
            dto.items,
          );

        // -----------------------------------------------------
        // UPDATE HEADER
        // -----------------------------------------------------

        const updated =
          await tx.purchaseReturn.update({
            where: {
              id,
            },

            data: {
              returnDate:
                dto.returnDate,

              purchaseBillId,

              supplierId,

              warehouseId,

              grossAmount:
                totals.grossAmount,

              taxableAmount:
                totals.taxableAmount,

              cgstAmount:
                totals.cgstAmount,

              sgstAmount:
                totals.sgstAmount,

              igstAmount:
                totals.igstAmount,

              netAmount:
                totals.netAmount,

              status:
                "ACTIVE",
            },
          });

        // -----------------------------------------------------
        // APPLY NEW ITEMS
        // -----------------------------------------------------

        for (const item of dto.items) {
          const qty =
            Number(item.qty);

          await this.applyStockOut(
            tx,
            warehouseId,
            item.itemId,
            item.batchId,
            qty,
          );

          const calculation =
            this.calculateItem(
              qty,
              item.purchaseRate,
              item.gstPercent,
            );

          await tx.purchaseReturnItem.create({
            data: {
              purchaseReturnId:
                id,

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              qty,

              purchaseRate:
                item.purchaseRate,

              gstPercent:
                item.gstPercent,

              taxableAmount:
                calculation.taxableAmount,

              cgstAmount:
                calculation.cgstAmount,

              sgstAmount:
                calculation.sgstAmount,

              igstAmount:
                calculation.igstAmount,

              netAmount:
                calculation.netAmount,
            },
          });

          await tx.stockLedger.create({
            data: {
              transactionDate:
                new Date(),

              transactionType:
                "PURCHASE_RETURN_EDIT",

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              warehouseId,

              qtyIn: 0,

              qtyOut:
                qty,

              referenceType:
                "PURCHASE_RETURN",

              referenceId:
                id,

              remarks:
                "Purchase Return Edit",
            },
          });
        }
          await this.ledgerService.postPurchaseReturn(
          supplierId,
          totals.netAmount,
          id,
           tx,
        );

        return updated;
      },
    ).then((result) =>
      this.findOne(result.id),
    );
  }

  // =========================================================
  // CANCEL PURCHASE RETURN
  // =========================================================

  async cancel(id: string, actor?: AuditActor) {
    return this.prisma.$transaction(
      async (tx) => {
        const purchaseReturn =
          await tx.purchaseReturn.findUnique({
            where: {
              id,
            },

            include: {
              items: true,
            },
          });

        if (!purchaseReturn) {
          throw new NotFoundException(
            "Purchase return not found.",
          );
        }

        if (
          purchaseReturn.status ===
          "CANCELLED"
        ) {
          throw new BadRequestException(
            "Purchase return is already cancelled.",
          );
        }

        // -----------------------------------------------------
        // RESTORE STOCK
        // -----------------------------------------------------

        for (
          const item of
          purchaseReturn.items
        ) {
          const qty =
            Number(item.qty);

          await this.applyStockIn(
            tx,
            purchaseReturn.warehouseId,
            item.itemId,
            item.batchId,
            qty,
          );

          await tx.stockLedger.create({
            data: {
              transactionDate:
                new Date(),

              transactionType:
                "PURCHASE_RETURN_CANCEL",

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              warehouseId:
                purchaseReturn.warehouseId,

              qtyIn:
                qty,

              qtyOut: 0,

              referenceType:
                "PURCHASE_RETURN",

              referenceId:
                purchaseReturn.id,

              remarks:
                "Purchase Return Cancelled - Stock Reversal",
            },
          });
        }

        // -----------------------------------------------------
        // REVERSE SUPPLIER LEDGER
        // -----------------------------------------------------

        await tx.ledgerEntry.create({
          data: {
            transactionDate:
              new Date(),

            partyType:
              "SUPPLIER",

            partyId:
              purchaseReturn.supplierId,

            transactionType:
              "PURCHASE_RETURN_CANCEL",

            referenceType:
              "PURCHASE_RETURN",

            referenceId:
              purchaseReturn.id,

            debitAmount: 0,

            creditAmount:
              Number(
                purchaseReturn.netAmount,
              ),

            remarks:
              "Purchase Return Cancelled - Ledger Reversal",
          },
        });

        // -----------------------------------------------------
        // MARK CANCELLED
        // -----------------------------------------------------

        await tx.purchaseReturn.update({
          where: {
            id,
          },

          data: {
            status:
              "CANCELLED",
          },
        });

        // -----------------------------------------------------
        // AUDIT: CANCELLATION
        // -----------------------------------------------------

        await this.auditService.record(tx, {
          actorId: actor?.id,
          actorName: actor?.name,
          action: "PURCHASE_RETURN_CANCELLED",
          entityType: "PurchaseReturn",
          entityId: purchaseReturn.id,
          details: {
            returnNo: purchaseReturn.returnNo,
            netAmount: Number(purchaseReturn.netAmount),
          },
        });

        return purchaseReturn;
      },
    ).then((result) =>
      this.findOne(result.id),
    );
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll() {
    return this.prisma.purchaseReturn.findMany({
      include: {
        supplier: true,

        warehouse: true,

        purchaseBill: true,

        items: {
          include: {
            item: true,

            batch: true,
          },
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },
    });
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(
    id: string,
  ) {
    const purchaseReturn =
      await this.prisma.purchaseReturn.findUnique({
        where: {
          id,
        },

        include: {
          supplier: true,

          warehouse: true,

          purchaseBill: true,

          items: {
            include: {
              item: true,

              batch: true,
            },
          },
        },
      });

    if (!purchaseReturn) {
      throw new NotFoundException(
        "Purchase return not found.",
      );
    }

    return purchaseReturn;
  }

  // =========================================================
  // FIND PURCHASE BILL FOR RETURN
  // =========================================================

  async findByPurchaseBill(
    purchaseBillId: string,
  ) {
    const purchase =
      await this.prisma.purchaseBill.findUnique({
        where: {
          id: purchaseBillId,
        },

        include: {
          supplier: true,

          warehouse: true,

          items: {
            include: {
              item: true,

              batch: {
                include: {
                  barcodes: true,
                },
              },
            },
          },
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        "Purchase bill not found.",
      );
    }

    const previousReturnItems =
      await this.prisma.purchaseReturnItem.findMany({
        where: {
          purchaseReturn: {
            purchaseBillId,

            status:
              "ACTIVE",
          },
        },

        select: {
          itemId: true,

          batchId: true,

          qty: true,
        },
      });

    const returnedQtyMap =
      new Map<string, number>();

    for (
      const returnItem of
      previousReturnItems
    ) {
      const key =
        `${returnItem.itemId}:${returnItem.batchId}`;

      returnedQtyMap.set(
        key,
        (returnedQtyMap.get(key) ?? 0) +
          Number(
            returnItem.qty,
          ),
      );
    }

    const items =
      await Promise.all(
        purchase.items.map(
          async (item) => {
            const key =
              `${item.itemId}:${item.batchId}`;

            const purchasedQty =
              Number(item.qty);

            const returnedQty =
              returnedQtyMap.get(key) ??
              0;

            const availableQty =
              Math.max(
                purchasedQty -
                  returnedQty,
                0,
              );

            const stock =
              await this.prisma.warehouseStock.findUnique({
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

            const currentStock =
              Number(
                stock?.quantity ?? 0,
              );

            const primaryBarcode =
              item.batch.barcodes.find(
                (barcode) =>
                  barcode.isPrimary,
              );

            return {
              id:
                item.id,

              purchaseBillId:
                item.purchaseBillId,

              itemId:
                item.itemId,

              itemCode:
                item.item.itemCode,

              itemName:
                item.item.name,

              batchId:
                item.batchId,

              batchNo:
                item.batch.batchNo,

              barcode:
                primaryBarcode?.barcode ??
                item.item.barcode ??
                "",

              purchasedQty,

              returnedQty,

              availableQty,

              currentStock,

              purchaseRate:
                Number(
                  item.purchaseRate,
                ),

              gstPercent:
                Number(
                  item.gstPercent,
                ),

              returnQty: 0,
            };
          },
        ),
      );

    return {
      id:
        purchase.id,

      billNo:
        purchase.billNo,

      billDate:
        purchase.billDate,

      invoiceNo:
        purchase.invoiceNo,

      invoiceDate:
        purchase.invoiceDate,

      supplierId:
        purchase.supplierId,

      warehouseId:
        purchase.warehouseId,

      grossAmount:
        Number(
          purchase.grossAmount,
        ),

      discountAmount:
        Number(
          purchase.discountAmount,
        ),

      taxableAmount:
        Number(
          purchase.taxableAmount,
        ),

      cgstAmount:
        Number(
          purchase.cgstAmount,
        ),

      sgstAmount:
        Number(
          purchase.sgstAmount,
        ),

      igstAmount:
        Number(
          purchase.igstAmount,
        ),

      netAmount:
        Number(
          purchase.netAmount,
        ),

      supplier:
        purchase.supplier,

      warehouse:
        purchase.warehouse,

      items,
    };
  }

  // =========================================================
  // VALIDATE RETURN ITEMS
  // =========================================================

  private async validateReturnItems(
    prisma:
      | PrismaService
      | Prisma.TransactionClient,

    purchaseBillId: string,

    items:
      CreatePurchaseReturnDto["items"],

    excludeReturnId?: string,
  ) {
    const purchaseBill =
      await prisma.purchaseBill.findUnique({
        where: {
          id: purchaseBillId,
        },

        include: {
          items: true,
        },
      });

    if (!purchaseBill) {
      throw new NotFoundException(
        "Purchase bill not found.",
      );
    }

    for (const item of items) {
      const purchaseItem =
        purchaseBill.items.find(
          (x) =>
            x.itemId ===
              item.itemId &&
            x.batchId ===
              item.batchId,
        );

      if (!purchaseItem) {
        throw new BadRequestException(
          `Item ${item.itemId} with batch ${item.batchId} does not belong to the selected purchase bill.`,
        );
      }

      const previousReturns =
        await prisma.purchaseReturnItem.aggregate({
          where: {
            itemId:
              item.itemId,

            batchId:
              item.batchId,

            purchaseReturn: {
              purchaseBillId,

              status:
                "ACTIVE",

              ...(excludeReturnId
                ? {
                    id: {
                      not:
                        excludeReturnId,
                    },
                  }
                : {}),
            },
          },

          _sum: {
            qty: true,
          },
        });

      const alreadyReturned =
        Number(
          previousReturns._sum.qty ??
            0,
        );

      const remainingQty =
        Math.max(
          Number(
            purchaseItem.qty,
          ) -
            alreadyReturned,
          0,
        );

      const requestedQty =
        Number(item.qty);

      if (
        requestedQty <= 0
      ) {
        throw new BadRequestException(
          "Return quantity must be greater than zero.",
        );
      }

      if (
        requestedQty >
        remainingQty
      ) {
        throw new BadRequestException(
          `Return quantity for item ${item.itemId} exceeds the remaining returnable quantity. Available: ${remainingQty}, Requested: ${requestedQty}.`,
        );
      }
    }
  }

  // =========================================================
  // CALCULATE ITEM
  // =========================================================

  private calculateItem(
    qty: number,
    purchaseRate: number,
    gstPercent: number,
  ) {
    const gross =
      Number(qty) *
      Number(purchaseRate);

    const tax =
      gross *
      Number(gstPercent) /
      100;

    const cgst =
      tax / 2;

    const sgst =
      tax / 2;

    return {
      taxableAmount:
        gross,

      cgstAmount:
        cgst,

      sgstAmount:
        sgst,

      igstAmount:
        0,

      netAmount:
        gross + tax,
    };
  }

  // =========================================================
  // CALCULATE TOTALS
  // =========================================================

  private calculateTotals(
    items:
      CreatePurchaseReturnDto["items"],
  ) {
    let grossAmount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let netAmount = 0;

    for (const item of items) {
      const calculation =
        this.calculateItem(
          Number(item.qty),
          Number(
            item.purchaseRate,
          ),
          Number(
            item.gstPercent,
          ),
        );

      grossAmount +=
        Number(item.qty) *
        Number(
          item.purchaseRate,
        );

      taxableAmount +=
        calculation.taxableAmount;

      cgstAmount +=
        calculation.cgstAmount;

      sgstAmount +=
        calculation.sgstAmount;

      igstAmount +=
        calculation.igstAmount;

      netAmount +=
        calculation.netAmount;
    }

    return {
      grossAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      netAmount,
    };
  }

  // =========================================================
  // STOCK OUT
  // =========================================================

  private async applyStockOut(
    prisma:
      Prisma.TransactionClient,

    warehouseId: string,

    itemId: string,

    batchId: string,

    qty: number,
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

    if (!stock) {
      throw new BadRequestException(
        `Warehouse stock not found for item ${itemId}.`,
      );
    }

    const availableStock =
      Number(
        stock.quantity,
      );

    if (
      availableStock <
      Number(qty)
    ) {
      throw new BadRequestException(
        `Insufficient stock for item ${itemId}. Available: ${availableStock}, Required: ${qty}.`,
      );
    }

    await prisma.warehouseStock.update({
      where: {
        id:
          stock.id,
      },

      data: {
        quantity: {
          decrement:
            qty,
        },
      },
    });
  }

  // =========================================================
  // STOCK IN / RESTORE
  // =========================================================

  private async applyStockIn(
    prisma:
      Prisma.TransactionClient,

    warehouseId: string,

    itemId: string,

    batchId: string,

    qty: number,
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

    if (!stock) {
      throw new BadRequestException(
        `Warehouse stock not found for item ${itemId}.`,
      );
    }

    await prisma.warehouseStock.update({
      where: {
        id:
          stock.id,
      },

      data: {
        quantity: {
          increment:
            qty,
        },
      },
    });
  }
}