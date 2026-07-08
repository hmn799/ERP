import apiClient from "@/api/client";

import type {
  Brand,
  CreateBrandDto,
} from "@/features/masters/brands/types/brand.types";

export const BrandService = {
  async getAll(): Promise<Brand[]> {
    const { data } = await apiClient.get("/brands");
    return data;
  },

  async get(id: string): Promise<Brand> {
    const { data } = await apiClient.get(`/brands/${id}`);
    return data;
  },

  async create(dto: CreateBrandDto): Promise<Brand> {
    const { data } = await apiClient.post("/brands", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateBrandDto,
  ): Promise<Brand> {
    const { data } = await apiClient.put(
      `/brands/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/brands/${id}`);
  },
};