import apiClient from "@/api/client";

export interface CreateOpeningStockDto {
  itemId: string;
  warehouseId: string;
  qty: number;
  purchaseRate: number;
  retailRate: number;
  wholesaleRate: number;
  distributorRate: number;
  mrp: number;
  expiryDate?: string;
  manufacturingDate?: string;
  transactionDate?: string;
  remarks?: string;
}

export interface OpeningStockEntry {
  id: string;
  transactionDate: string;
  qtyIn: number;
  remarks: string | null;
  item: { name: string; itemCode: string };
  warehouse: { name: string };
  batch: {
    batchNo: string;
    mrp: number;
    expiryDate: string | null;
  };
}

export interface BulkOpeningStockError {
  row: number;
  message: string;
}

export interface BulkOpeningStockResult {
  total: number;
  successCount: number;
  errors: BulkOpeningStockError[];
}

export const OpeningStockService = {
  async list(): Promise<OpeningStockEntry[]> {
    const { data } = await apiClient.get("/opening-stock");
    return data;
  },

  async create(
    dto: CreateOpeningStockDto,
  ): Promise<OpeningStockEntry> {
    const { data } = await apiClient.post("/opening-stock", dto);
    return data;
  },

  async bulkCreate(
    rows: CreateOpeningStockDto[],
  ): Promise<BulkOpeningStockResult> {
    const { data } = await apiClient.post("/opening-stock/bulk", {
      rows,
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/opening-stock/${id}`);
  },
};

export default OpeningStockService;
