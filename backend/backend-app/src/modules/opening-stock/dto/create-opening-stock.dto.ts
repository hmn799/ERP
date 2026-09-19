import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class CreateOpeningStockDto {
  @IsString()
  itemId: string;

  @IsString()
  warehouseId: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber()
  @Min(0)
  purchaseRate: number;

  @IsNumber()
  @Min(0)
  retailRate: number;

  @IsNumber()
  @Min(0)
  wholesaleRate: number;

  @IsNumber()
  @Min(0)
  distributorRate: number;

  @IsNumber()
  @Min(0)
  mrp: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
