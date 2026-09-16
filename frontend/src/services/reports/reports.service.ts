import apiClient from "@/api/client";

export interface DashboardFastMovingItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  qtySold: number;
  salesValue: number;
}

export interface DashboardSummary {
  totalSales: number;
  totalPurchase: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  stockItems: number;
  stockQty: number;
  totalProfit: number;
  deadStockItems: number;
  fastMovingItems: DashboardFastMovingItem[];
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
}

export interface LowStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  stock: number;
}

export interface SalesRegisterRow {
  salesBillId: string;
  billNo: string;
  billDate: string;
  customerCode: string;
  customerName: string;
  salesman?: string;
  warehouse?: string;
  grossAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
  isCredit: boolean;
}

export interface ItemSalesRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  qtySold: number;
  salesValue: number;
}

export interface PartySalesRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  billCount: number;
  salesValue: number;
}

export interface PurchaseRegisterRow {
  purchaseBillId: string;
  billNo: string;
  billDate: string;
  supplierCode: string;
  supplierName: string;
  warehouse?: string;
  grossAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
}

export interface StockRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  stock: number;
}

export interface BatchStockRow {
  itemCode: string;
  itemName: string;
  batchId: string;
  batchNo: string;
  mrp: number;
  purchaseRate: number;
  stock: number;
  expiryDate: string | null;
}

export interface StockValuationRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  stock: number;
  purchaseRate: number;
  stockValue: number;
}

export interface StockValuationReport {
  items: StockValuationRow[];
  totalStockValue: number;
}

export interface StockLedgerRow {
  date: string;
  itemCode: string;
  itemName: string;
  batchNo: string;
  warehouse: string;
  transactionType: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
}

export interface ProfitRow {
  itemCode: string;
  itemName: string;
  batchNo: string;
  qty: number;
  saleRate: number;
  saleValue: number;
  purchaseRate: number;
  costValue: number;
  profit: number;
}

export interface GstSummary {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  salesCount: number;
  purchaseCount: number;
}

export const ReportsService = {
  async getDashboard(): Promise<DashboardSummary> {
    const { data } = await apiClient.get(
      "/reports/dashboard",
    );
    return data;
  },

  async getSalesTrend(
    days = 14,
  ): Promise<SalesTrendPoint[]> {
    const { data } = await apiClient.get(
      "/reports/sales-trend",
      { params: { days } },
    );
    return data;
  },

  async getLowStockReport(): Promise<LowStockItem[]> {
    const { data } = await apiClient.get(
      "/reports/low-stock-report",
    );
    return data;
  },

  async getSalesRegister(): Promise<
    SalesRegisterRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/sales-register",
    );
    return data;
  },

  async getItemSalesReport(): Promise<
    ItemSalesRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/item-sales-report",
    );
    return data;
  },

  async getPartySalesReport(): Promise<
    PartySalesRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/party-sales-report",
    );
    return data;
  },

  async getPurchaseRegister(): Promise<
    PurchaseRegisterRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/purchase-register",
    );
    return data;
  },

  async getStockReport(): Promise<StockRow[]> {
    const { data } = await apiClient.get(
      "/reports/stock-report",
    );
    return data;
  },

  async getBatchStockReport(): Promise<
    BatchStockRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/batch-stock-report",
    );
    return data;
  },

  async getStockValuationReport(): Promise<
    StockValuationReport
  > {
    const { data } = await apiClient.get(
      "/reports/stock-valuation-report",
    );
    return data;
  },

  async getStockLedgerReport(): Promise<
    StockLedgerRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/stock-ledger-report",
    );
    return data;
  },

  async getProfitReport(): Promise<ProfitRow[]> {
    const { data } = await apiClient.get(
      "/reports/profit-report",
    );
    return data;
  },

  async getGstSummary(): Promise<GstSummary> {
    const { data } = await apiClient.get(
      "/reports/gst-summary",
    );
    return data;
  },
};

export default ReportsService;
