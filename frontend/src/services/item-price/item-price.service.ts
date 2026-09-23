import apiClient from "@/api/client";

export interface ItemPrice {
  id: string;
  itemId: string;
  priceListId: string;
  minQty: number | string;
  salePrice: number | string;
  minimumPrice?: number | string | null;
  maximumDiscountPercent?: number | string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  allowManualOverride: boolean;
  isActive: boolean;
  item?: {
    id: string;
    itemCode: string;
    name: string;
  };
}

export interface CreateItemPriceDto {
  itemId: string;
  priceListId: string;
  minQty?: number;
  salePrice: number;
  minimumPrice?: number;
  maximumDiscountPercent?: number;
  isActive?: boolean;
}

const ItemPriceService = {
  async getByPriceList(
    priceListId: string,
  ): Promise<ItemPrice[]> {
    const { data } = await apiClient.get(
      `/item-price/price-list/${priceListId}`,
    );
    return data;
  },

  async create(
    dto: CreateItemPriceDto,
  ): Promise<ItemPrice> {
    const { data } = await apiClient.post(
      "/item-price",
      dto,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/item-price/${id}`);
  },
};

export default ItemPriceService;
