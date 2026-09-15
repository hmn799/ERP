export interface PurchaseListItem {
  id: string;

  billNo: string;

  billDate: string;

  invoiceNo: string | null;

  supplierId: string;

  supplierName: string;

  warehouseName: string;

  totalItems: number;

  totalAmount: number;

  status: string;
}

export interface PurchaseListResponse {
  data: PurchaseListItem[];

  total: number;

  page: number;

  pageSize: number;
}