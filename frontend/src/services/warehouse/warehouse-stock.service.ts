import apiClient from "@/api/client";

export interface WarehouseStockRow {
  id: string;
  warehouseId: string;
  itemId: string;
  batchId: string;
  quantity: number;
  item: { id: string; itemCode: string; name: string };
  batch: {
    id: string;
    batchNo: string;
    mrp: number;
    expiryDate: string | null;
  };
}

export async function getWarehouseStock(
  warehouseId: string,
): Promise<WarehouseStockRow[]> {
  const { data } = await apiClient.get(`/warehouses/${warehouseId}/stock`);
  return data;
}
