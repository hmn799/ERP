import { Injectable } from '@nestjs/common';

import { BatchCreateService } from './batch-create.service';
import { BatchBarcodeService } from './batch-barcode.service';
import { BatchSearchService } from './batch-search.service';

import {
  inventoryDecisionEngine,
  InventoryDecisionType,
} from '../../../core/inventory/inventory-decision.engine';

@Injectable()
export class BatchResolveService {
  constructor(
    private readonly batchSearchService: BatchSearchService,

    private readonly batchCreateService: BatchCreateService,

    private readonly batchBarcodeService: BatchBarcodeService,
  ) {}

  async resolve(data: {
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
  }) {
    const existing =
      await this.batchSearchService.findMatchingBatch({
        itemId: data.itemId,
        purchaseRate: data.purchaseRate,
        mrp: data.mrp,
        expiryDate: data.expiryDate,
        manufacturingDate: data.manufacturingDate,
      });

    if (!existing) {
      const batch =
        await this.batchCreateService.createBatch(data);

      return {
        batch,
        created: true,
        alternateBarcodeAdded: false,
        decision: InventoryDecisionType.CREATE_BATCH,
      };
    }

    const decision =
      inventoryDecisionEngine.decide(
        {
          itemId: data.itemId,
          purchaseRate: data.purchaseRate,
          mrp: data.mrp,
          expiryDate: data.expiryDate,
          manufacturingDate: data.manufacturingDate,
          barcode: data.barcode,
        },
        {
          id: existing.id,
          batchNo: existing.batchNo,
          purchaseRate: Number(existing.purchaseRate),
          mrp: Number(existing.mrp),
          expiryDate: existing.expiryDate,
          manufacturingDate:
            existing.manufacturingDate,
          barcodes: existing.barcodes.map(
            (x) => x.barcode,
          ),
        },
      );

    if (
      decision.decision ===
      InventoryDecisionType.ADD_ALTERNATE_BARCODE
    ) {
      if (data.barcode) {
        await this.batchBarcodeService.createAlternateBarcode(
          existing.id,
          data.barcode,
        );
      }

      return {
        batch: existing,
        created: false,
        alternateBarcodeAdded: true,
        decision:
          InventoryDecisionType.ADD_ALTERNATE_BARCODE,
      };
    }

    return {
      batch: existing,
      created: false,
      alternateBarcodeAdded: false,
      decision: InventoryDecisionType.REUSE_BATCH,
    };
  }
}