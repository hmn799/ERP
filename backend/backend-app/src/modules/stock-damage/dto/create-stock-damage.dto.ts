import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateStockDamageDto {
  @IsDateString()
  damageDate: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsNumber()
  @Min(0.01)
  qty: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
