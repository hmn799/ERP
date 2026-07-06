export class CreateItemDto {
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

  conversionFactor: number;

  mrp: number;

  purchaseRate: number;
}