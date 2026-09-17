import {
  calculateSalesRowAmounts,
  SalesRowLike,
  SalesTaxMode,
} from "./sales.calculator";

export interface SalesTotals {
  gross: number;
  itemDiscount: number;
  taxable: number;
  billDiscount: number;
  cgst: number;
  sgst: number;
  net: number;
}

/*
 * Mirrors the bill-discount-ratio math that previously lived inline
 * in SalesPage.tsx's totals useMemo - the bill-level discount is
 * spread across rows proportionally to their own taxable amount,
 * then CGST/SGST are re-derived off the post-discount taxable so
 * the tax always matches what's actually billed.
 */
export function calculateSalesTotals(
  rows: SalesRowLike[],
  billDiscountPercent: number,
  taxMode: SalesTaxMode = "EXCLUSIVE",
): SalesTotals {
  let gross = 0;

  let itemDiscount = 0;

  let taxable = 0;

  let cgst = 0;

  let sgst = 0;

  for (const row of rows) {
    const amounts = calculateSalesRowAmounts(
      row,
      taxMode,
    );

    gross += amounts.grossAmount;

    itemDiscount +=
      amounts.discountAmount;

    taxable += amounts.taxableAmount;

    cgst += amounts.cgstAmount;

    sgst += amounts.sgstAmount;
  }

  const billDiscount =
    (taxable * billDiscountPercent) / 100;

  const finalTaxable =
    taxable - billDiscount;

  let finalCgst = cgst;

  let finalSgst = sgst;

  if (billDiscount > 0) {
    const ratio =
      taxable > 0
        ? finalTaxable / taxable
        : 0;

    finalCgst = cgst * ratio;

    finalSgst = sgst * ratio;
  }

  const net =
    finalTaxable + finalCgst + finalSgst;

  return {
    gross,
    itemDiscount,
    taxable: finalTaxable,
    billDiscount,
    cgst: finalCgst,
    sgst: finalSgst,
    net,
  };
}
