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
};

export default ReportsService;
