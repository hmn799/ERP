export enum InventoryDecisionType {
  REUSE_BATCH = 'REUSE_BATCH',

  CREATE_BATCH = 'CREATE_BATCH',

  ADD_ALTERNATE_BARCODE = 'ADD_ALTERNATE_BARCODE',
}

export interface InventoryComparisonInput {
  itemId: string;

  purchaseRate: number;

  mrp: number;

  expiryDate?: Date | null;

  manufacturingDate?: Date | null;

  barcode?: string;
}

export interface ExistingBatchInfo {
  id: string;

  batchNo: string;

  purchaseRate: number;

  mrp: number;

  expiryDate?: Date | null;

  manufacturingDate?: Date | null;

  barcodes: string[];
}

export interface InventoryDecision {
  decision: InventoryDecisionType;

  reason: string;

  existingBatchId?: string;

  existingBatchNo?: string;
}

export class InventoryDecisionEngine {
  decide(
    incoming: InventoryComparisonInput,
    existing: ExistingBatchInfo,
  ): InventoryDecision {
    if (
      incoming.purchaseRate !== existing.purchaseRate
    ) {
      return {
        decision: InventoryDecisionType.CREATE_BATCH,
        reason: 'Purchase rate changed.',
      };
    }

    if (incoming.mrp !== existing.mrp) {
      return {
        decision: InventoryDecisionType.CREATE_BATCH,
        reason: 'MRP changed.',
      };
    }

    const incomingExpiry =
      incoming.expiryDate?.toISOString();

    const existingExpiry =
      existing.expiryDate?.toISOString();

    if (incomingExpiry !== existingExpiry) {
      return {
        decision: InventoryDecisionType.CREATE_BATCH,
        reason: 'Expiry changed.',
      };
    }

    const incomingMfg =
      incoming.manufacturingDate?.toISOString();

    const existingMfg =
      existing.manufacturingDate?.toISOString();

    if (incomingMfg !== existingMfg) {
      return {
        decision: InventoryDecisionType.CREATE_BATCH,
        reason: 'Manufacturing date changed.',
      };
    }

    if (
      incoming.barcode &&
      !existing.barcodes.includes(incoming.barcode)
    ) {
      return {
        decision:
          InventoryDecisionType.ADD_ALTERNATE_BARCODE,

        reason: 'New barcode detected.',

        existingBatchId: existing.id,

        existingBatchNo: existing.batchNo,
      };
    }

    return {
      decision: InventoryDecisionType.REUSE_BATCH,

      reason: 'Reuse existing batch.',

      existingBatchId: existing.id,

      existingBatchNo: existing.batchNo,
    };
  }
}

export const inventoryDecisionEngine =
  new InventoryDecisionEngine();