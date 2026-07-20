export interface PurchaseItem {
  itemId: string;

  batchNo: string;

  qty: number;

  freeQty?: number;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  expiryDate?: string;

  manufacturingDate?: string;

  barcode?: string;

  discountPercent: number;

  gstPercent: number;
}

export interface Purchase {
  id: string;

  billNo: string;

  billDate: string;

  supplierId: string;

  warehouseId: string;

  purchaseOrderId?: string;

  invoiceNo?: string;

  invoiceDate?: string;

  billDiscountPercent?: number;

  items: PurchaseItem[];
}

export type CreatePurchaseDto = Omit<
  Purchase,
  "id"
>;