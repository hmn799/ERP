import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { BatchCreateService } from "./batch-create.service";
import { BatchBarcodeService } from "./batch-barcode.service";
import { BatchSearchService } from "./batch-search.service";

import {
  inventoryDecisionEngine,
  InventoryDecisionType,
} from "../../../core/inventory/inventory-decision.engine";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BatchResolveService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly batchSearchService: BatchSearchService,

    private readonly batchCreateService: BatchCreateService,

    private readonly batchBarcodeService: BatchBarcodeService,
  ) {}

  async resolve(
    data: {
      itemId: string;

      purchaseRate: number;

      retailRate: number;

      wholesaleRate: number;

      distributorRate: number;

      mrp: number;

      expiryDate?: Date;

      manufacturingDate?: Date;

      purchaseBillId?: string;

      barcode?: string;
    },
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    // =====================================
    // FIND EXISTING MATCHING BATCH
    // =====================================

    const existing =
      await this.batchSearchService.findMatchingBatch(
        {
          itemId: data.itemId,

          purchaseRate:
            data.purchaseRate,

          mrp:
            data.mrp,

          expiryDate:
            data.expiryDate,

          manufacturingDate:
            data.manufacturingDate,
        },
        prisma,
      );

    // =====================================
    // CREATE NEW BATCH
    // =====================================

    if (!existing) {
      const batch =
        await this.batchCreateService.createBatch(
          data,
          prisma,
        );

      return {
        batch,

        created: true,

        alternateBarcodeAdded:
          false,

        decision:
          InventoryDecisionType.CREATE_BATCH,
      };
    }

    // =====================================
    // EXISTING BATCH FOUND
    // =====================================

    const decision =
      inventoryDecisionEngine.decide(
        {
          itemId:
            data.itemId,

          purchaseRate:
            data.purchaseRate,

          mrp:
            data.mrp,

          expiryDate:
            data.expiryDate,

          manufacturingDate:
            data.manufacturingDate,

          barcode:
            data.barcode,
        },

        {
          id:
            existing.id,

          batchNo:
            existing.batchNo,

          purchaseRate:
            Number(
              existing.purchaseRate,
            ),

          mrp:
            Number(
              existing.mrp,
            ),

          expiryDate:
            existing.expiryDate,

          manufacturingDate:
            existing.manufacturingDate,

          barcodes:
            existing.barcodes.map(
              (x) => x.barcode,
            ),
        },
      );

    // =====================================
    // UPDATE BATCH PRICING
    // =====================================
    //
    // IMPORTANT:
    // The matching batch is being reused.
    // Therefore its latest purchase pricing
    // must be synchronized with the purchase.
    //
    // This fixes the issue where EDIT PURCHASE
    // continued showing old Retail / Wholesale /
    // Distributor / MRP values.
    //
    // =====================================

    const updatedBatch =
      await prisma.batch.update({
        where: {
          id:
            existing.id,
        },

        data: {
          purchaseRate:
            data.purchaseRate,

          retailRate:
            data.retailRate,

          wholesaleRate:
            data.wholesaleRate,

          distributorRate:
            data.distributorRate,

          mrp:
            data.mrp,

          purchaseBillId:
            data.purchaseBillId,

          lastPurchaseDate:
            new Date(),
        },

        include: {
          barcodes: true,
        },
      });

    // =====================================
    // ADD ALTERNATE BARCODE
    // =====================================

    if (
      decision.decision ===
      InventoryDecisionType.ADD_ALTERNATE_BARCODE
    ) {
      if (data.barcode) {
        await this.batchBarcodeService.createAlternateBarcode(
          updatedBatch.id,

          data.barcode,

          prisma,
        );
      }

      return {
        batch:
          updatedBatch,

        created:
          false,

        alternateBarcodeAdded:
          true,

        decision:
          InventoryDecisionType.ADD_ALTERNATE_BARCODE,
      };
    }

    // =====================================
    // REUSE EXISTING BATCH
    // =====================================

    return {
      batch:
        updatedBatch,

      created:
        false,

      alternateBarcodeAdded:
        false,

      decision:
        InventoryDecisionType.REUSE_BATCH,
    };
  }
}
