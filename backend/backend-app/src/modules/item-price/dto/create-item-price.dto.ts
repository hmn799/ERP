import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateItemPriceDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  priceListId: string;

  // The qty this tier starts applying at - e.g. 1 for the base
  // rate, 10 for a "10 or more" rate.
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  minQty?: number;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maximumDiscountPercent?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  allowManualOverride?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  changedBy?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
