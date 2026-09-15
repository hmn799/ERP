export interface SalesItemDto {
  itemId: string;
  batchId: string;
  qty: number;
  discountPercent: number;
  gstPercent: number;
  saleRate?: number;
}

export type SalesPaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "CREDIT";

export interface SalesPaymentDto {
  paymentMode: SalesPaymentMode;

  amount: number;

  cardSurcharge?: number;

  transactionNo?: string;

  remarks?: string;
}

export interface CreateSalesDto {
  billNo?: string;
  billDate: string;

  customerId?: string;
  warehouseId: string;
  salesmanId?: string;

  isCredit?: boolean;

  billDiscountPercent?: number;
  roundOff?: number;
  shortAmount?: number;

  payments?: SalesPaymentDto[];

  items: SalesItemDto[];
}

export interface SalesItemResponse {
  id: string;
  itemId: string;
  batchId: string;

  qty: number | string;
  saleRate: number | string;

  discountPercent: number | string;
  gstPercent: number | string;

  taxableAmount: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  netAmount: number | string;

  item?: {
    id?: string;
    itemCode?: string;
    name?: string;
    barcode?: string | null;
    hsnCode?: string | null;
  };

  batch?: {
    id?: string;
    batchNo?: string;
    purchaseRate?: number | string;
    retailRate?: number | string;
    wholesaleRate?: number | string;
    distributorRate?: number | string;
    mrp?: number | string;
  };
}

export interface SalesResponse {
  id: string;

  billNo: string;
  billDate: string;

  customerId?: string | null;
  warehouseId: string;
  salesmanId?: string | null;

  grossAmount: number | string;
  itemDiscountAmount: number | string;
  billDiscountAmount: number | string;
  taxableAmount: number | string;

  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;

    netAmount: number | string;

  roundOff: number | string;
  shortAmount: number | string;
  finalPayable: number | string;

  isCredit: boolean;

  customer?: {
    id: string;
    customerCode: string;
    name: string;
    gstCategory?: string;
    gstin?: string | null;
  };

  warehouse?: {
    id: string;
    name: string;
  };

  salesman?: {
    id: string;
    name: string;
  } | null;

  items: SalesItemResponse[];

  payments?: {
    id: string;
    salesBillId: string;
    paymentMode: SalesPaymentMode;
    amount: number | string;
    cardSurcharge: number | string;
    transactionNo?: string | null;
    remarks?: string | null;
    createdAt?: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

export interface SalesListItem {
  id: string;

  billNo: string;
  billDate: string;

  customerId?: string | null;
  warehouseId: string;

  grossAmount: number | string;
  taxableAmount: number | string;
  netAmount: number | string;

  roundOff: number | string;
  shortAmount: number | string;
  finalPayable: number | string;

  isCredit: boolean;

  customer?: {
    name: string;
  };

  warehouse?: {
    name: string;
  };

  payments?: {
    id: string;
    paymentMode: SalesPaymentMode;
    amount: number | string;
    cardSurcharge: number | string;
    transactionNo?: string | null;
    remarks?: string | null;
  }[];
}

export interface CustomerLookup {
  id: string;
  customerCode: string;
  name: string;

  gstCategory?: string;
  gstin?: string | null;

  mobile?: string | null;
  email?: string | null;

  customerGroup?: string;
  priceLevel?: string;

  creditLimit?: number | string;
  openingBalance?: number | string;

  city?: string | null;
  state?: string | null;
}

export interface CreateCustomerDto {
  customerCode: string;
  name: string;
  customerGroup: string;

  priceLevel?: string;
  priceListId?: string;

  gstCategory: string;
  gstin?: string;

  mobile?: string;
  email?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  openingBalance?: number;
  creditLimit?: number;

  routeId?: string;
  salesmanId?: string;

  isActive?: boolean;
}

export interface CustomerLedgerEntry {
  id: string;

  transactionDate: string;
  partyType?: string;
  partyId?: string;

  transactionType: string;
  referenceType?: string;
  referenceId?: string;

  debitAmount?: number | string;
  creditAmount?: number | string;

  remarks?: string;
}

export interface WarehouseLookup {
  id: string;
  name: string;
}

export interface SalesItemLookup {
  id: string;

  itemCode: string;
  name: string;

  barcode: string | null;

  purchaseRate: number | string;
  retailRate: number | string;
  wholesaleRate: number | string;
  distributorRate: number | string;
  mrp: number | string;

  unit: string;
}

export interface SalesBatchLookup {
  id: string;
  batchNo: string;
  itemId: string;

  purchaseRate: number | string;
  retailRate: number | string;
  wholesaleRate: number | string;
  distributorRate: number | string;
  mrp: number | string;

  expiryDate?: string | null;
  status?: string;
  isActive?: boolean;
}