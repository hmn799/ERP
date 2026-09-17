export interface Item {
  id: string;

  itemCode: string;

  name: string;

  hsnCode?: string;

  barcode?: string;

  categoryId: string;
  subCategoryId?: string;
  brandId?: string;

  gstSlabId: string;

  baseUnitId: string;
  purchaseUnitId: string;
  saleUnitId: string;

  mrp: number;

  purchaseRate: number;

  minQty?: number;

  reorderQty?: number;

  isActive: boolean;

  category?: {
    id: string;
    name: string;
  };

  subCategory?: {
    id: string;
    name: string;
  };

  brand?: {
    id: string;
    name: string;
  };

  gstSlab?: {
    id: string;
    name: string;
    percentage: number;
  };

  baseUnit?: {
    id: string;
    name: string;
  };

  purchaseUnit?: {
    id: string;
    name: string;
  };

  saleUnit?: {
    id: string;
    name: string;
  };
}

export interface CreateItemDto {
  name: string;

  hsnCode?: string;

  barcode?: string;

  categoryId: string;

  subCategoryId?: string;

  brandId?: string;

  gstSlabId: string;

  baseUnitId: string;

  purchaseUnitId: string;

  saleUnitId: string;

  mrp: number;

  purchaseRate: number;

  minQty?: number;

  reorderQty?: number;

  isActive?: boolean;
}