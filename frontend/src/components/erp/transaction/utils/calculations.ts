import { TransactionRowModel } from "../transaction.types";

/**
 * Returns stock quantity including free quantity.
 */
export function calculateStockQty(
  row: TransactionRowModel,
): number {
  return row.qty + row.freeQty;
}

/**
 * Returns line value before GST.
 * Used only for UI preview.
 */
export function calculateLineValue(
  row: TransactionRowModel,
): number {
  return Number(
    (row.qty * row.purchaseRate).toFixed(2),
  );
}

/**
 * Returns purchase rate from entered values.
 * Used only for UI preview.
 */
export function calculatePurchaseRate(
  row: TransactionRowModel,
): number {
  if (row.qty <= 0) return 0;

  return Number(row.purchaseRate.toFixed(4));
}