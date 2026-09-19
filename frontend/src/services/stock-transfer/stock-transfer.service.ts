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

export interface CreateStockTransferItemDto {
  itemId: string;
  batchId: string;
  qty: number;
}

export interface CreateStockTransferDto {
  transferDate: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  remarks?: string;
  items: CreateStockTransferItemDto[];
}

export interface StockTransferListItem {
  id: string;
  transferNo: string;
  transferDate: string;
  remarks: string | null;
  fromWarehouse: { name: string };
  toWarehouse: { name: string };
  items: { qty: number }[];
}

export interface StockTransferDetail {
  id: string;
  transferNo: string;
  transferDate: string;
  remarks: string | null;
  fromWarehouse: { id: string; name: string };
  toWarehouse: { id: string; name: string };
  items: {
    id: string;
    qty: number;
    item: { itemCode: string; name: string };
    batch: { batchNo: string; mrp: number; expiryDate: string | null };
  }[];
}

export const StockTransferService = {
  async getWarehouseStock(
    warehouseId: string,
  ): Promise<WarehouseStockRow[]> {
    const { data } = await apiClient.get(
      `/warehouses/${warehouseId}/stock`,
    );
    return data;
  },

  async list(): Promise<StockTransferListItem[]> {
    const { data } = await apiClient.get("/stock-transfers");
    return data;
  },

  async get(id: string): Promise<StockTransferDetail> {
    const { data } = await apiClient.get(`/stock-transfers/${id}`);
    return data;
  },

  async create(
    dto: CreateStockTransferDto,
  ): Promise<StockTransferDetail> {
    const { data } = await apiClient.post("/stock-transfers", dto);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/stock-transfers/${id}`);
  },
};

export default StockTransferService;
