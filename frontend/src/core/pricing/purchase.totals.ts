import {
  TransactionRowModel,
  TransactionTotals,
} from "@/components/erp/transaction/transaction.types";

import { PurchaseTaxMode } from "./purchase.calculator";

export function calculatePurchaseTotals(
  rows: TransactionRowModel[],
  taxMode: PurchaseTaxMode = "EXCLUSIVE",
): TransactionTotals {
  const totals: TransactionTotals = {
    totalQty: 0,

    totalFreeQty: 0,

    grossAmount: 0,

    discountAmount: 0,

    taxableAmount: 0,

    cgstAmount: 0,

    sgstAmount: 0,

    igstAmount: 0,

    roundOff: 0,

    netAmount: 0,
  };

  for (const row of rows) {
    totals.totalQty += row.qty;

    totals.totalFreeQty += row.freeQty;

    const effectiveRate =
      taxMode === "INCLUSIVE" && row.gstPercent > 0
        ? row.purchaseRate / (1 + row.gstPercent / 100)
        : row.purchaseRate;

    totals.grossAmount +=
      row.qty * effectiveRate;

    totals.taxableAmount +=
      row.taxableAmount;

    totals.cgstAmount +=
      row.cgstAmount;

    totals.sgstAmount +=
      row.sgstAmount;

    totals.igstAmount +=
      row.igstAmount;

    totals.netAmount +=
      row.netAmount;
  }

  return totals;
}