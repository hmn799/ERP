import apiClient from "@/api/client";

import type {
  SubCategory,
  CreateSubCategoryDto,
} from "@/features/masters/sub-categories/types/sub-category.types";

export const SubCategoryService = {
  async getAll(): Promise<SubCategory[]> {
    const { data } = await apiClient.get("/sub-categories");
    return data;
  },

  async get(id: string): Promise<SubCategory> {
    const { data } = await apiClient.get(
      `/sub-categories/${id}`,
    );

    return data;
  },

  async create(
    dto: CreateSubCategoryDto,
  ): Promise<SubCategory> {
    const { data } = await apiClient.post(
      "/sub-categories",
      dto,
    );

    return data;
  },

  async update(
    id: string,
    dto: CreateSubCategoryDto,
  ): Promise<SubCategory> {
    const { data } = await apiClient.put(
      `/sub-categories/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/sub-categories/${id}`);
  },
};

export default SubCategoryService;