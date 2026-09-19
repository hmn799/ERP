import apiClient from "@/api/client";

export interface CreateSalesOrderItemDto {
  itemId: string;
  qtyOrdered: number;
  saleRate: number;
  discountPercent: number;
  gstPercent: number;
}

export interface CreateSalesOrderDto {
  customerId?: string;
  warehouseId: string;
  orderDate: string;
  expectedDate?: string;
  remarks?: string;
  items: CreateSalesOrderItemDto[];
}

export interface SalesOrderItemResponse {
  id: string;
  salesOrderId: string;
  itemId: string;
  qtyOrdered: number | string;
  qtyDelivered: number | string;
  pendingQty: number | string;
  saleRate: number | string;
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

export interface SalesOrderResponse {
  id: string;
  soNo: string;
  soDate: string;
  customerId: string | null;
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
  customer?: { id: string; customerCode: string; name: string } | null;
  warehouse?: { id: string; name: string };
  items?: SalesOrderItemResponse[];
  salesBills?: Array<{ id: string; billNo: string; billDate: string }>;
}

export interface SalesOrderListItem {
  id: string;
  soNo: string;
  soDate: string;
  status: string;
  customer?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string };
  items: SalesOrderItemResponse[];
  netAmount: number | string;
}

export interface FulfillSalesOrderItemDto {
  salesOrderItemId: string;
  batchId: string;
  qty: number;
}

export interface FulfillSalesOrderDto {
  billDate?: string;
  items: FulfillSalesOrderItemDto[];
}

export const SalesOrderService = {
  async list(): Promise<SalesOrderListItem[]> {
    const { data } = await apiClient.get("/sales-order");
    return data;
  },

  async get(id: string): Promise<SalesOrderResponse> {
    const { data } = await apiClient.get(`/sales-order/${id}`);
    return data;
  },

  async create(dto: CreateSalesOrderDto): Promise<SalesOrderResponse> {
    const { data } = await apiClient.post("/sales-order", dto);
    return data;
  },

  async fulfill(id: string, dto: FulfillSalesOrderDto) {
    const { data } = await apiClient.post(`/sales-order/${id}/fulfill`, dto);
    return data;
  },

  async cancel(id: string): Promise<SalesOrderResponse> {
    const { data } = await apiClient.post(`/sales-order/${id}/cancel`, {});
    return data;
  },
};

export default SalesOrderService;
