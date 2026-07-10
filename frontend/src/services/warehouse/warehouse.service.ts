import apiClient from "@/api/client";

import type {
  Warehouse,
  CreateWarehouseDto,
} from "@/features/masters/warehouses/types/warehouse.types";

export const WarehouseService = {
  async getAll(): Promise<Warehouse[]> {
    const { data } = await apiClient.get("/warehouses");
    return data;
  },

  async get(id: string): Promise<Warehouse> {
    const { data } = await apiClient.get(`/warehouses/${id}`);
    return data;
  },

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const { data } = await apiClient.post("/warehouses", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateWarehouseDto,
  ): Promise<Warehouse> {
    const { data } = await apiClient.put(
      `/warehouses/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/warehouses/${id}`);
  },
};

export default WarehouseService;