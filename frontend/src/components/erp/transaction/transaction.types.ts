export type TransactionMode =
  | "purchase"
  | "sale"
  | "purchase-return"
  | "sale-return";

export interface TransactionRowModel {
  id: string;

  barcode: string;

  itemId: string;
  itemCode: string;
  itemName: string;

  batchId: string;
  batchNo: string;

  qty: number;
  freeQty: number;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  gstPercent: number;

  discountPercent: number;

  taxableAmount: number;

  cgstAmount: number;

  sgstAmount: number;

  igstAmount: number;

  netAmount: number;
}

export interface TransactionTotals {
  totalQty: number;

  totalFreeQty: number;

  grossAmount: number;

  discountAmount: number;

  taxableAmount: number;

  cgstAmount: number;

  sgstAmount: number;

  igstAmount: number;

  roundOff: number;

  netAmount: number;
}