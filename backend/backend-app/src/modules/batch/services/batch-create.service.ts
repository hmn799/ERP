import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

import { DocumentNumberService } from "../../../core/document-number/document-number.service";

import { BatchBarcodeService } from "./batch-barcode.service";

@Injectable()
export class BatchCreateService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly documentNumberService: DocumentNumberService,

    private readonly barcodeService: BatchBarcodeService,
  ) {}

  async createBatch(
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
    const batchNo =
      await this.documentNumberService.next(
        "BATCH",
      );

    const batch =
      await prisma.batch.create({
        data: {
          batchNo,

          itemId: data.itemId,

          purchaseRate:
            data.purchaseRate,

          retailRate:
            data.retailRate,

          wholesaleRate:
            data.wholesaleRate,

          distributorRate:
            data.distributorRate,

          mrp: data.mrp,

          expiryDate:
            data.expiryDate,

          manufacturingDate:
            data.manufacturingDate,

          creationReason:
            "NEW_ITEM",

          purchaseBillId:
            data.purchaseBillId,
        },
      });

    if (data.barcode) {
      await this.barcodeService.createPrimaryBarcode(
        batch.id,
        data.barcode,
        prisma,
      );
    }

    return batch;
  }
}