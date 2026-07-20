import {
  TransactionRowModel,
  TransactionTotals,
} from "@/components/erp/transaction/transaction.types";

export function calculatePurchaseTotals(
  rows: TransactionRowModel[],
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

    totals.grossAmount +=
      row.qty * row.purchaseRate;

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