import apiClient from "@/api/client";

import type {
  Item,
  CreateItemDto,
} from "@/features/masters/items/types/item.types";

export interface ItemBarcodesSummary {
  itemBarcode: string | null;
  batches: {
    batchId: string;
    batchNo: string;
    barcodes: {
      id: string;
      barcode: string;
      isPrimary: boolean;
    }[];
  }[];
}

const itemService = {
  async getAll(): Promise<Item[]> {
    const { data } = await apiClient.get("/items");
    return data;
  },

  async get(id: string): Promise<Item> {
    const { data } = await apiClient.get(`/items/${id}`);
    return data;
  },

  async create(dto: CreateItemDto): Promise<Item> {
    const { data } = await apiClient.post("/items", dto);
    return data;
  },

  async update(
    id: string,
    dto: Partial<CreateItemDto>,
  ): Promise<Item> {
    const { data } = await apiClient.patch(
      `/items/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/items/${id}`);
  },

  async getBarcodes(id: string): Promise<ItemBarcodesSummary> {
    const { data } = await apiClient.get(
      `/items/${id}/barcodes`,
    );
    return data;
  },
};

export default itemService;