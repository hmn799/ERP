import apiClient from "@/api/client";

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogQuery {
  entityType?: string;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export const AuditService = {
  async list(query: AuditLogQuery = {}): Promise<AuditLogPage> {
    const { data } = await apiClient.get("/audit-log", {
      params: query,
    });
    return data;
  },

  async actions(): Promise<string[]> {
    const { data } = await apiClient.get("/audit-log/actions");
    return data;
  },
};

export default AuditService;
