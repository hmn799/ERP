import { IsString } from 'class-validator';

export class BatchStockQueryDto {
  @IsString()
  warehouseId!: string;
}