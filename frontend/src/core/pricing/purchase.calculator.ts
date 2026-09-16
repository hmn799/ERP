import { TransactionRowModel } from "@/components/erp/transaction/transaction.types";

export type PurchaseTaxMode = "EXCLUSIVE" | "INCLUSIVE";

/*
 * Mirrors the backend's conversion exactly (purchase-save.service.ts)
 * so the on-screen preview matches what will actually be saved. The
 * entered rate itself (row.purchaseRate) is never overwritten here -
 * only the derived tax fields are, using this exclusive-equivalent.
 */
function toExclusiveRate(
  rate: number,
  gstPercent: number,
  taxMode: PurchaseTaxMode,
) {
  if (taxMode !== "INCLUSIVE" || gstPercent <= 0) {
    return rate;
  }

  return rate / (1 + gstPercent / 100);
}

export function calculatePurchaseRow(
  row: TransactionRowModel,
  taxMode: PurchaseTaxMode = "EXCLUSIVE",
): TransactionRowModel {
  const qty = Number(row.qty) || 0;

  const freeQty = Number(row.freeQty) || 0;

  const enteredRate =
    Number(row.purchaseRate) || 0;

  const gst =
    Number(row.gstPercent) || 0;

  const purchaseRate = toExclusiveRate(
    enteredRate,
    gst,
    taxMode,
  );

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