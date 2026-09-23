import apiClient from "@/api/client";

export interface StockDamage {
  id: string;
  damageNo: string;
  damageDate: string;
  warehouseId: string;
  itemId: string;
  batchId: string;
  qty: number | string;
  costValue: number | string;
  reason: string;
  status: string;
  item?: { id: string; itemCode: string; name: string };
  batch?: { id: string; batchNo: string };
  warehouse?: { id: string; name: string };
}

export interface CreateStockDamageDto {
  damageDate: string;
  warehouseId: string;
  itemId: string;
  batchId: string;
  qty: number;
  reason: string;
}

const StockDamageService = {
  async getAll(): Promise<StockDamage[]> {
    const { data } = await apiClient.get("/stock-damage");
    return data;
  },

  async create(
    dto: CreateStockDamageDto,
  ): Promise<StockDamage> {
    const { data } = await apiClient.post(
      "/stock-damage",
      dto,
    );
    return data;
  },

  async cancel(id: string): Promise<StockDamage> {
    const { data } = await apiClient.post(
      `/stock-damage/${id}/cancel`,
    );
    return data;
  },
};

export default StockDamageService;
