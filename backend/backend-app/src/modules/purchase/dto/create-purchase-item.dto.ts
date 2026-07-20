import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreatePurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  batchNo!: string;

  @IsNumber()
  @Min(0.01)
  qty!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeQty?: number;

  @IsNumber()
  @Min(0)
  purchaseRate!: number;

  @IsNumber()
  @Min(0)
  retailRate!: number;

  @IsNumber()
  @Min(0)
  wholesaleRate!: number;

  @IsNumber()
  @Min(0)
  distributorRate!: number;

  @IsNumber()
  @Min(0)
  mrp!: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @IsOptional()
  @IsDateString()
  manufacturingDate?: Date;

  @IsNumber()
  @Min(0)
  discountPercent!: number;

  @IsNumber()
  @Min(0)
  gstPercent!: number;
}