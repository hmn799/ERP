export interface PurchaseReturnItem {
  id: string;

  itemId: string;
  itemCode: string;
  itemName: string;

  batchId: string;
  batchNo: string;

  barcode: string;

  purchasedQty: number;
  returnedQty: number;
  availableQty: number;
  currentStock: number;

  purchaseRate: number;
  gstPercent: number;

  returnQty: number;
}

export interface PurchaseReturnPurchase {
  id: string;

  billNo: string;
  billDate: string;

  invoiceNo?: string | null;
  invoiceDate?: string | null;

  supplierId: string;

  supplier: {
    id: string;
    supplierCode: string;
    name: string;
    gstType?: string;
    gstin?: string | null;
  };

  warehouseId: string;

  warehouse: {
    id: string;
    name: string;
  };
}

export interface PurchaseReturnableResponse
  extends PurchaseReturnPurchase {
  items: Omit<
    PurchaseReturnItem,
    "returnQty"
  >[];
}

export interface CreatePurchaseReturnItemDto {
  itemId: string;
  batchId: string;
  qty: number;
  purchaseRate: number;
  gstPercent: number;
}

export interface CreatePurchaseReturnDto {
  returnNo?: string;

  returnDate: string;

  purchaseBillId: string;

  supplierId?: string;

  warehouseId?: string;

  items: CreatePurchaseReturnItemDto[];
}

/*
 * =========================================================
 * PURCHASE RETURN LIST / DETAIL
 * =========================================================
 */

export interface PurchaseReturnListItem {
  id: string;

  returnNo: string;

  returnDate: string;

  purchaseBillId: string;

  purchaseBillNo: string;

  supplierId: string;

  supplierName: string;

  warehouseId: string;

  warehouseName: string;

  totalItems: number;

  totalQty: number;

  grossAmount: number;

  taxableAmount: number;

  cgstAmount: number;

  sgstAmount: number;

  igstAmount: number;

  netAmount: number;
}

/*
 * Full return returned by the backend.
 */

export interface PurchaseReturnResponse {
  id: string;

  returnNo: string;

  returnDate: string;

  purchaseBillId: string;

  supplierId: string;

  warehouseId: string;

  grossAmount: number;

  taxableAmount: number;

  cgstAmount: number;

  sgstAmount: number;

  igstAmount: number;

  netAmount: number;

  supplier?: {
    id: string;
    supplierCode: string;
    name: string;
    gstType?: string;
    gstin?: string | null;
  };

  warehouse?: {
    id: string;
    name: string;
  };

  purchaseBill?: {
    id: string;
    billNo: string;
    billDate: string;
    invoiceNo?: string | null;
    invoiceDate?: string | null;
  };

  items?: Array<{
    id: string;

    itemId: string;

    batchId: string;

    qty: number;

    purchaseRate: number;

    gstPercent: number;

    taxableAmount: number;

    cgstAmount: number;

    sgstAmount: number;

    igstAmount: number;

    netAmount: number;

    item?: {
      id: string;
      itemCode: string;
      name: string;
      barcode?: string | null;
    };

    batch?: {
      id: string;
      batchNo: string;
    };
  }>;
}