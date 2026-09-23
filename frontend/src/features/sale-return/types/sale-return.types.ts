export type SaleReturnPaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "CREDIT";

export interface SaleReturnPayment {
  id?: string;
  paymentMode: SaleReturnPaymentMode;
  amount: number;
  cardSurcharge?: number;
  transactionNo?: string | null;
  remarks?: string | null;
}

export interface SaleReturnSale {
  id: string;
  billNo: string;
  billDate: string;

  customerId?: string | null;
  warehouseId: string;

  grossAmount: number;
  itemDiscountAmount: number;
  billDiscountAmount: number;
  taxableAmount: number;

  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;

  netAmount: number;
  roundOff: number;
  shortAmount: number;
  finalPayable: number;

  isCredit: boolean;

  customer?: {
    id: string;
    customerCode?: string | null;
    name: string;
    mobile?: string | null;
    gstin?: string | null;
  } | null;

  warehouse?: {
    id: string;
    name: string;
  };

  items: SaleReturnSaleItem[];
}

export interface SaleReturnSaleItem {
  id: string;

  salesBillId?: string;

  itemId: string;
  batchId: string;

  qty: number;
  saleRate: number;
  discountPercent: number;
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
    purchaseRate?: number;
    retailRate?: number;
    wholesaleRate?: number;
    distributorRate?: number;
    mrp?: number;
  };
}

export interface SaleReturnItemRow {
  itemId: string;
  batchId: string;

  itemCode: string;
  itemName: string;
  barcode: string;

  batchNo: string;

  soldQty: number;
  returnedQty: number;
  returnableQty: number;

  saleRate: number;
  gstPercent: number;

  returnQty: number;
}

export interface CreateSaleReturnItemDto {
  itemId: string;
  batchId: string;
  qty: number;
  saleRate: number;
  gstPercent: number;
}

export interface CreateSaleReturnPaymentDto {
  paymentMode: SaleReturnPaymentMode;
  amount: number;
  cardSurcharge?: number;
  transactionNo?: string;
  remarks?: string;
}

export interface CreateSaleReturnDto {
  returnNo?: string;
  returnDate: string;

  /*
   * Omitted for a direct return - one taken back without a
   * previous sales bill on file.
   */
  salesBillId?: string;

  customerId?: string;
  warehouseId: string;

  items: CreateSaleReturnItemDto[];

  payments: CreateSaleReturnPaymentDto[];
}

export interface SaleReturnResponse {
  id: string;

  returnNo: string;
  returnDate: string;

  salesBillId?: string | null;

  customerId?: string | null;
  warehouseId: string;

  grossAmount: number;
  taxableAmount: number;

  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;

  netAmount: number;

  customer?: {
    id: string;
    customerCode?: string | null;
    name: string;
    mobile?: string | null;
    gstin?: string | null;
  } | null;

  warehouse?: {
    id: string;
    name: string;
  };

  salesBill?: {
    id: string;
    billNo: string;
    billDate: string;
    customerId?: string | null;
    warehouseId: string;
    netAmount: number;
    finalPayable: number;
    isCredit: boolean;
  };

  items?: Array<{
    id: string;

    itemId: string;
    batchId: string;

    qty: number;
    saleRate: number;
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

  payments?: SaleReturnPayment[];
}
