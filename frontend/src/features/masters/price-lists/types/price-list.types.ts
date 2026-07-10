export interface PriceList {
  id: string;

  code: string;

  name: string;

  description?: string;

  priority: number;

  isDefault: boolean;

  isActive: boolean;
}

export interface CreatePriceListDto {
  code: string;

  name: string;

  description?: string;

  priority: number;

  isDefault: boolean;

  isActive: boolean;
}