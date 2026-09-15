import apiClient from "@/api/client";

import type {
  Scheme,
  CreateSchemeDto,
} from "@/features/masters/schemes/types/scheme.types";

export const SchemeService = {
  async getAll(): Promise<Scheme[]> {
    const { data } = await apiClient.get("/schemes");
    return data;
  },

  async get(id: string): Promise<Scheme> {
    const { data } = await apiClient.get(`/schemes/${id}`);
    return data;
  },

  async create(dto: CreateSchemeDto): Promise<Scheme> {
    const { data } = await apiClient.post("/schemes", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateSchemeDto,
  ): Promise<Scheme> {
    const { data } = await apiClient.put(
      `/schemes/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/schemes/${id}`);
  },
};

export default SchemeService;
