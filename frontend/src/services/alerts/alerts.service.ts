import apiClient from "@/api/client";

export interface BusinessAlert {
  id: string;
  category: "LOW_STOCK" | "OVERDUE_RECEIVABLE" | "SCHEME_EXPIRY";
  severity: "WARNING" | "CRITICAL";
  message: string;
  source: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export const AlertsService = {
  async list(): Promise<BusinessAlert[]> {
    const { data } = await apiClient.get("/alerts");
    return data;
  },

  async generate(): Promise<void> {
    await apiClient.post("/alerts/generate");
  },

  async acknowledge(id: string): Promise<void> {
    await apiClient.post(`/alerts/${id}/acknowledge`);
  },
};

export default AlertsService;
