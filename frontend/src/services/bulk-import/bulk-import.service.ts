import apiClient from "@/api/client";

export interface BulkImportError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  total: number;
  successCount: number;
  errors: BulkImportError[];
}

export type ImportEntity =
  | "category"
  | "brand"
  | "unit"
  | "warehouse"
  | "gst-slab"
  | "supplier"
  | "customer"
  | "item"
  | "opening-stock";

export const BulkImportService = {
  async import(
    entity: ImportEntity,
    rows: Record<string, string>[],
  ): Promise<BulkImportResult> {
    const { data } = await apiClient.post(
      `/bulk-import/${entity}`,
      { rows },
    );

    return data;
  },
};

export default BulkImportService;
