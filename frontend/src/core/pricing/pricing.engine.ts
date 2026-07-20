import {
  formulaEngine,
  PurchaseRateMode,
} from "../formula/formula.engine";

import { TransactionRow } from "../types/transaction.types";

export class PricingEngine {
  calculatePurchaseRate(
    row: TransactionRow,
  ) {
    return formulaEngine.calculatePurchaseRate(
      row.qty,
      row.freeQty,
      row.totalValue,
      PurchaseRateMode.INVOICE_BASED,
    );
  }

  calculateStockQty(
    row: TransactionRow,
  ) {
    return formulaEngine.calculateStockQty(
      row.qty,
      row.freeQty,
    );
  }

  calculateTotalValue(
    qty: number,
    purchaseRate: number,
  ) {
    return formulaEngine.calculateTotalValue(
      qty,
      purchaseRate,
    );
  }
}

export const pricingEngine =
  new PricingEngine();