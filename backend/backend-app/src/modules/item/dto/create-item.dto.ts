import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateItemDto {
  @IsOptional()
  @IsString()
  itemCode?: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsString()
  gstSlabId: string;

  @IsString()
  baseUnitId: string;

  @IsString()
  purchaseUnitId: string;

  @IsString()
  saleUnitId: string;

  @IsNumber()
  @Min(1)
  conversionFactor: number;

  @IsNumber()
  mrp: number;

  @IsNumber()
  purchaseRate: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}