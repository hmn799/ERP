import { TransactionRowModel } from "@/components/erp/transaction/transaction.types";

export function calculatePurchaseRow(
  row: TransactionRowModel,
): TransactionRowModel {
  const qty = Number(row.qty) || 0;

  const freeQty = Number(row.freeQty) || 0;

  const purchaseRate =
    Number(row.purchaseRate) || 0;

  const gst =
    Number(row.gstPercent) || 0;

  const grossAmount =
    qty * purchaseRate;

  const taxableAmount =
    grossAmount;

  const gstAmount =
    (taxableAmount * gst) / 100;

  const cgstAmount =
    gstAmount / 2;

  const sgstAmount =
    gstAmount / 2;

  const igstAmount = 0;

  const netAmount =
    taxableAmount + gstAmount;

  return {
    ...row,

    qty,

    freeQty,

    taxableAmount,

    cgstAmount,

    sgstAmount,

    igstAmount,

    netAmount,
  };
}