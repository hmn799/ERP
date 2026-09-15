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

export class CreatePartyPriceDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;

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
  effectiveFrom?: Date;

  @IsOptional()
  @IsDateString()
  effectiveTo?: Date;

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
