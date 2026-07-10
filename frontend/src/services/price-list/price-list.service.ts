import apiClient from "@/api/client";

import type {
  PriceList,
  CreatePriceListDto,
} from "@/features/masters/price-lists/types/price-list.types";

export const PriceListService = {
  async getAll(): Promise<PriceList[]> {
    const { data } = await apiClient.get("/price-lists");
    return data;
  },

  async get(id: string): Promise<PriceList> {
    const { data } = await apiClient.get(`/price-lists/${id}`);
    return data;
  },

  async create(dto: CreatePriceListDto): Promise<PriceList> {
    const { data } = await apiClient.post("/price-lists", dto);
    return data;
  },

  async update(
    id: string,
    dto: CreatePriceListDto,
  ): Promise<PriceList> {
    const { data } = await apiClient.put(
      `/price-lists/${id}`,
      dto,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/price-lists/${id}`);
  },
};

export default PriceListService;