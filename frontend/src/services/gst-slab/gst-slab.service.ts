import apiClient from "@/api/client";

import type {
  GstSlab,
  CreateGstSlabDto,
} from "@/features/masters/gst-slabs/types/gst-slab.types";

export const GstSlabService = {
  async getAll(): Promise<GstSlab[]> {
    const { data } = await apiClient.get("/gst-slabs");
    return data;
  },

  async get(id: string): Promise<GstSlab> {
    const { data } = await apiClient.get(`/gst-slabs/${id}`);
    return data;
  },

  async create(dto: CreateGstSlabDto): Promise<GstSlab> {
    const { data } = await apiClient.post("/gst-slabs", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreateGstSlabDto,
  ): Promise<GstSlab> {
    const { data } = await apiClient.put(
      `/gst-slabs/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/gst-slabs/${id}`);
  },
};

export default GstSlabService;