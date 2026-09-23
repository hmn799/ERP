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
 *
 * A return row (isReturn) is excluded from that discount spread
 * entirely - a discretionary discount on what's being sold has no
 * bearing on an item taken back - and its own full amount is
 * subtracted from the bill total afterward instead. Mirrors the
 * backend's sales-calculation.service.ts exactly.
 */
export function calculateSalesTotals(
  rows: SalesRowLike[],
  billDiscountPercent: number,
  taxMode: SalesTaxMode = "EXCLUSIVE",
): SalesTotals {
  let saleGross = 0;
  let saleItemDiscount = 0;
  let saleTaxable = 0;
  let saleCgst = 0;
  let saleSgst = 0;

  let returnGross = 0;
  let returnItemDiscount = 0;
  let returnTaxable = 0;
  let returnCgst = 0;
  let returnSgst = 0;

  for (const row of rows) {
    const amounts = calculateSalesRowAmounts(
      row,
      taxMode,
    );

    if (row.isReturn) {
      returnGross +=
        amounts.grossAmount;

      returnItemDiscount +=
        amounts.discountAmount;

      returnTaxable +=
        amounts.taxableAmount;

      returnCgst +=
        amounts.cgstAmount;

      returnSgst +=
        amounts.sgstAmount;

      continue;
    }

    saleGross += amounts.grossAmount;

    saleItemDiscount +=
      amounts.discountAmount;

    saleTaxable += amounts.taxableAmount;

    saleCgst += amounts.cgstAmount;

    saleSgst += amounts.sgstAmount;
  }

  const billDiscount =
    (saleTaxable * billDiscountPercent) /
    100;

  const finalSaleTaxable =
    saleTaxable - billDiscount;

  let finalSaleCgst = saleCgst;

  let finalSaleSgst = saleSgst;

  if (billDiscount > 0) {
    const ratio =
      saleTaxable > 0
        ? finalSaleTaxable / saleTaxable
        : 0;

    finalSaleCgst = saleCgst * ratio;

    finalSaleSgst = saleSgst * ratio;
  }

  const gross = saleGross - returnGross;

  const itemDiscount =
    saleItemDiscount - returnItemDiscount;

  const taxable =
    finalSaleTaxable - returnTaxable;

  const cgst = finalSaleCgst - returnCgst;

  const sgst = finalSaleSgst - returnSgst;

  const net = taxable + cgst + sgst;

  return {
    gross,
    itemDiscount,
    taxable,
    billDiscount,
    cgst,
    sgst,
    net,
  };
}
