/*
 * =========================================================
 * PURCHASE ORDER TYPES
 * =========================================================
 */

/*
 * =========================================================
 * CREATE PURCHASE ORDER
 * =========================================================
 */

export interface CreatePurchaseOrderItemDto {
  itemId: string;

  qtyOrdered: number;

  purchaseRate: number;

  discountPercent: number;

  gstPercent: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;

  warehouseId: string;

  orderDate: string;

  expectedDate?: string;

  remarks?: string;

  items: CreatePurchaseOrderItemDto[];
}

/*
 * =========================================================
 * PURCHASE ORDER ITEM RESPONSE
 * =========================================================
 */

export interface PurchaseOrderItemResponse {
  id: string;

  purchaseOrderId: string;

  itemId: string;

  qtyOrdered: number | string;

  qtyReceived: number | string;

  pendingQty: number | string;

  purchaseRate: number | string;

  discountPercent: number | string;

  gstPercent: number | string;

  taxableAmount: number | string;

  cgstAmount: number | string;

  sgstAmount: number | string;

  igstAmount: number | string;

  netAmount: number | string;

  item?: {
    id: string;

    itemCode: string;

    name: string;

    barcode?: string | null;
  };
}

/*
 * =========================================================
 * PURCHASE ORDER RESPONSE
 * =========================================================
 */

export interface PurchaseOrderResponse {
  id: string;

  poNo: string;

  poDate: string;

  supplierId: string;

  warehouseId: string;

  status: string;

  grossAmount: number | string;

  discountAmount: number | string;

  taxableAmount: number | string;

  cgstAmount: number | string;

  sgstAmount: number | string;

  igstAmount: number | string;

  netAmount: number | string;

  remarks?: string | null;

  createdAt?: string;

  updatedAt?: string;

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

  items?: PurchaseOrderItemResponse[];

  purchaseBills?: Array<{
    id: string;

    billNo: string;

    billDate: string;
  }>;
}

/*
 * =========================================================
 * RECEIVE PURCHASE ORDER
 * =========================================================
 */

export interface ReceivePurchaseOrderItemDto {
  purchaseOrderItemId: string;

  qtyReceived: number;

  batchNo: string;

  expiryDate?: string;

  purchaseRate?: number;

  retailRate?: number;

  wholesaleRate?: number;

  distributorRate?: number;

  mrp?: number;

  barcode?: string;
}

export interface ReceivePurchaseOrderDto {
  billNo?: string;

  billDate?: string;

  invoiceNo?: string;

  invoiceDate?: string;

  remarks?: string;

  items: ReceivePurchaseOrderItemDto[];
}

/*
 * =========================================================
 * PURCHASE ORDER LIST ITEM
 * =========================================================
 */

export interface PurchaseOrderListItem {
  id: string;

  poNo: string;

  poDate: string;

  supplierId: string;

  supplierName: string;

  warehouseId: string;

  warehouseName: string;

  status: string;

  totalItems: number;

  totalQty: number;

  grossAmount: number;

  discountAmount: number;

  taxableAmount: number;

  cgstAmount: number;

  sgstAmount: number;

  igstAmount: number;

  netAmount: number;
}
