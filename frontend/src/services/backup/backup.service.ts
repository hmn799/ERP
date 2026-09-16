import apiClient from "@/api/client";

export interface BackupRun {
  id: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  trigger: "MANUAL" | "SCHEDULED";
  actorId: string | null;
  actorName: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  checksum: string | null;
  restoreVerifiedAt: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface BackupRunPage {
  items: BackupRun[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RestoreDrillResult {
  success: boolean;
  permissionCount?: number;
  roleCount?: number;
}

export const BackupService = {
  async list(page = 1, pageSize = 25): Promise<BackupRunPage> {
    const { data } = await apiClient.get("/backups", {
      params: { page, pageSize },
    });
    return data;
  },

  async run(): Promise<BackupRun> {
    const { data } = await apiClient.post("/backups/run");
    return data;
  },

  async restoreDrill(id: string): Promise<RestoreDrillResult> {
    const { data } = await apiClient.post(
      `/backups/${id}/restore-drill`,
    );
    return data;
  },

  async download(id: string, fileName: string): Promise<void> {
    const response = await apiClient.get(
      `/backups/${id}/download`,
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data]),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default BackupService;
