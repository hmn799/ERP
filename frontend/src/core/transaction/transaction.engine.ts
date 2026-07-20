import { pricingEngine } from "../pricing/pricing.engine";

import { TransactionRow } from "../types/transaction.types";

export class TransactionEngine {
  recalculate(
    row: TransactionRow,
  ): TransactionRow {
    row.purchaseRate =
      pricingEngine.calculatePurchaseRate(
        row,
      );

    return row;
  }
}

export const transactionEngine =
  new TransactionEngine();