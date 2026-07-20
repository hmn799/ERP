export interface TransactionRow {
  id: string;

  itemId: string;

  itemCode?: string;

  itemName?: string;

  barcode?: string;

  batchId?: string;

  batchNo?: string;

  qty: number;

  freeQty: number;

  totalValue: number;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  gstPercent: number;

  taxableAmount: number;

  cgstAmount: number;

  sgstAmount: number;

  igstAmount: number;

  netAmount: number;

  expiryDate?: string;

  manufacturingDate?: string;
}