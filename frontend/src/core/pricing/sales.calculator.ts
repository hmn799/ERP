export type SalesTaxMode = "EXCLUSIVE" | "INCLUSIVE";

export interface SalesRowLike {
  qty: number;
  saleRate: number;
  discountPercent: number;
  gstPercent: number;

  /*
   * A return taken back within this same bill (an exchange) rather
   * than a separate SaleReturn document. The row's own amounts
   * below stay positive magnitudes either way - only the bill
   * totals in sales.totals.ts subtract a return row instead of
   * adding it.
   */
  isReturn?: boolean;
}

export interface SalesRowAmounts {
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  gstAmount: number;
  netAmount: number;
}

/*
 * Mirrors the backend's conversion exactly (sales-calculation.service.ts)
 * so the on-screen preview matches what will actually be saved. The
 * entered rate itself (row.saleRate) is never overwritten by this -
 * only the derived amounts below use the exclusive-equivalent.
 */
function toExclusiveRate(
  rate: number,
  gstPercent: number,
  taxMode: SalesTaxMode,
) {
  if (taxMode !== "INCLUSIVE" || gstPercent <= 0) {
    return rate;
  }

  return rate / (1 + gstPercent / 100);
}

/*
 * Computes the display amounts for a single sales row - the Amount
 * column in the grid, and (summed across rows) the bill totals.
 * Discount is applied to the gross amount before GST, matching the
 * existing inline math this replaces in SalesItemsGrid/SalesPage.
 */
export function calculateSalesRowAmounts(
  row: SalesRowLike,
  taxMode: SalesTaxMode = "EXCLUSIVE",
): SalesRowAmounts {
  const qty = Number(row.qty) || 0;

  const enteredRate =
    Number(row.saleRate) || 0;

  const gst =
    Number(row.gstPercent) || 0;

  const effectiveRate = toExclusiveRate(
    enteredRate,
    gst,
    taxMode,
  );

  const grossAmount = qty * effectiveRate;

  const discountAmount =
    (grossAmount *
      (Number(row.discountPercent) || 0)) /
    100;

  const taxableAmount =
    grossAmount - discountAmount;

  const gstAmount =
    (taxableAmount * gst) / 100;

  const cgstAmount = gstAmount / 2;

  const sgstAmount = gstAmount / 2;

  const netAmount =
    taxableAmount + gstAmount;

  return {
    grossAmount,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    gstAmount,
    netAmount,
  };
}
