import apiClient from "@/api/client";

import type {
  Category,
  CreateCategoryDto,
} from "@/features/masters/categories/types/category.types";

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await apiClient.get("/categories");
    return data;
  },

  async get(id: string): Promise<Category> {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
  },

  async create(dto: CreateCategoryDto): Promise<Category> {
    const { data } = await apiClient.post("/categories", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const { data } = await apiClient.put(
      `/categories/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

export default CategoryService;