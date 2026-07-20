import {
  inventoryDecisionEngine,
  type ExistingBatchInfo,
  type InventoryComparisonInput,
} from "../inventory/inventory-decision.engine";

export class PurchaseEngine {
  processBatch(
    incoming: InventoryComparisonInput,
    existing?: ExistingBatchInfo,
  ) {
    if (!existing) {
      return {
        createBatch: true,
        reason: "No existing ERP batch found.",
      };
    }

    const decision =
      inventoryDecisionEngine.decide(
        incoming,
        existing,
      );

    return {
      createBatch:
        decision.decision ===
        "CREATE_BATCH",

      addAlternateBarcode:
        decision.decision ===
        "ADD_ALTERNATE_BARCODE",

      reuseBatch:
        decision.decision ===
        "REUSE_BATCH",

      decision,
    };
  }
}

export const purchaseEngine =
  new PurchaseEngine();