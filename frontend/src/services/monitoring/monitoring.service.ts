import apiClient from "@/api/client";

export interface SystemAlert {
  id: string;
  category: string;
  severity: "WARNING" | "CRITICAL";
  message: string;
  source: string | null;
  details: Record<string, unknown> | null;
  acknowledgedAt: string | null;
  acknowledgedById: string | null;
  acknowledgedByName: string | null;
  createdAt: string;
}

export interface AlertQuery {
  category?: string;
  severity?: string;
  acknowledged?: "true" | "false";
  page?: number;
  pageSize?: number;
}

export interface AlertPage {
  items: SystemAlert[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AlertSummaryRow {
  category: string;
  severity: string;
  count: number;
}

export interface ReconciliationResult {
  checkedAt: string;
  exceptionCount: number;
  exceptions: Array<{
    type: string;
    details: Record<string, unknown>;
  }>;
}

export const MonitoringService = {
  async listAlerts(query: AlertQuery = {}): Promise<AlertPage> {
    const { data } = await apiClient.get("/monitoring/alerts", {
      params: query,
    });
    return data;
  },

  async summary(): Promise<AlertSummaryRow[]> {
    const { data } = await apiClient.get("/monitoring/summary");
    return data;
  },

  async acknowledge(id: string): Promise<SystemAlert> {
    const { data } = await apiClient.post(
      `/monitoring/alerts/${id}/acknowledge`,
    );
    return data;
  },

  async runReconciliation(): Promise<ReconciliationResult> {
    const { data } = await apiClient.post(
      "/monitoring/reconciliation/run",
    );
    return data;
  },
};

export default MonitoringService;
