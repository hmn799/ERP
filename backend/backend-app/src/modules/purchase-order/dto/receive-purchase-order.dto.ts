export class ReceivePurchaseOrderItemDto {
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

export class ReceivePurchaseOrderDto {
  billNo?: string;

  billDate?: Date;

  invoiceNo?: string;

  invoiceDate?: Date;

  remarks?: string;

  items: ReceivePurchaseOrderItemDto[];
}