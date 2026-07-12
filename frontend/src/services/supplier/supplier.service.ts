import apiClient from "@/api/client";

import type {
  Supplier,
  CreateSupplierDto,
} from "@/features/masters/suppliers/types/supplier.types";

export const SupplierService = {
  async getAll(): Promise<Supplier[]> {
    const { data } = await apiClient.get("/suppliers");
    return data;
  },

  async get(id: string): Promise<Supplier> {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data;
  },

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const { data } = await apiClient.post("/suppliers", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateSupplierDto,
  ): Promise<Supplier> {
    const { data } = await apiClient.put(
      `/suppliers/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`);
  },
};

export default SupplierService;