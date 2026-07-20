import apiClient from "@/api/client";

import type {
  Purchase,
  CreatePurchaseDto,
} from "@/features/purchase/types/purchase.types";

const purchaseService = {
  async getAll(): Promise<Purchase[]> {
    const { data } = await apiClient.get(
      "/purchases",
    );

    return data;
  },

  async get(
    id: string,
  ): Promise<Purchase> {
    const { data } =
      await apiClient.get(
        `/purchases/${id}`,
      );

    return data;
  },

  async create(
    dto: CreatePurchaseDto,
  ): Promise<Purchase> {
    const { data } =
      await apiClient.post(
        "/purchases",
        dto,
      );

    return data;
  },
};

export default purchaseService;