import apiClient from "@/api/client";

export interface StockVelocityRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  currentStock: number;
  qtySoldLast90Days: number;
  avgDailySales: number;
  daysOfCover: number | null;
  lastSoldDate: string | null;
  classification: "FAST" | "SLOW" | "DEAD";
}

export interface ReorderRecommendation {
  itemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  currentStock: number;
  avgDailySales: number;
  daysOfCover: number | null;
  reorderPoint: number;
  leadTimeDays: number;
  coverDays: number;
  recommendedQty: number;
}

export interface SalesForecast {
  method: string;
  historyDays: number;
  history: Array<{ date: string; actual: number }>;
  forecast: Array<{ date: string; projected: number }>;
  projectedTotal: number;
  dailyTrendPerDay: number;
}

export interface CategoryPerformanceRow {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  qtySold: number;
  salesValue: number;
  costValue: number;
  profit: number;
  marginPercent: number;
}

export interface TrendPeriod {
  billCount: number;
  salesValue: number;
  grossProfit: number;
  customerCount: number;
  purchaseValue: number;
}

export interface TrendAnalysis {
  periodDays: number;
  current: TrendPeriod;
  previous: TrendPeriod;
  growth: Record<keyof TrendPeriod, number>;
}

export const AnalyticsService = {
  async stockVelocity(): Promise<StockVelocityRow[]> {
    const { data } = await apiClient.get(
      "/analytics/stock-velocity",
    );
    return data;
  },

  async reorderRecommendations(): Promise<
    ReorderRecommendation[]
  > {
    const { data } = await apiClient.get(
      "/analytics/reorder-recommendations",
    );
    return data;
  },

  async salesForecast(
    days = 14,
    historyDays = 60,
  ): Promise<SalesForecast> {
    const { data } = await apiClient.get(
      "/analytics/sales-forecast",
      { params: { days, historyDays } },
    );
    return data;
  },

  async categoryPerformance(
    days = 30,
  ): Promise<CategoryPerformanceRow[]> {
    const { data } = await apiClient.get(
      "/analytics/category-performance",
      { params: { days } },
    );
    return data;
  },

  async trend(periodDays = 30): Promise<TrendAnalysis> {
    const { data } = await apiClient.get(
      "/analytics/trend",
      { params: { periodDays } },
    );
    return data;
  },
};

export default AnalyticsService;
