export type SchemeType =
  | "QUANTITY"
  | "FREE_ITEM"
  | "DISCOUNT";

export interface Scheme {
  id: string;

  name: string;
  schemeType: SchemeType;

  itemId: string;
  item?: {
    id: string;
    itemCode: string;
    name: string;
  };

  buyQty?: number | string | null;
  freeQty?: number | string | null;

  freeItemId?: string | null;
  freeItem?: {
    id: string;
    itemCode: string;
    name: string;
  } | null;

  discountPercent?: number | string | null;

  isActive: boolean;

  effectiveFrom?: string | null;
  effectiveTo?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchemeDto {
  name: string;
  schemeType: SchemeType;
  itemId: string;

  buyQty?: number;
  freeQty?: number;

  freeItemId?: string;

  discountPercent?: number;

  isActive?: boolean;

  effectiveFrom?: string;
  effectiveTo?: string;
}
