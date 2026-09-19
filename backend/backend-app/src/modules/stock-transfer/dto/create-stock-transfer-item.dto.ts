import { IsNumber, IsPositive, IsString } from "class-validator";

export class CreateStockTransferItemDto {
  @IsString()
  itemId!: string;

  @IsString()
  batchId!: string;

  @IsNumber()
  @IsPositive()
  qty!: number;
}
