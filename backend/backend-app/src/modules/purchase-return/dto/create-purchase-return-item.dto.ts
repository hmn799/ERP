import {
  IsNumber,
  IsString,
  Min,
} from "class-validator";

export class CreatePurchaseReturnItemDto {
  @IsString()
  itemId!: string;

  @IsString()
  batchId!: string;

  @IsNumber()
  @Min(0.01)
  qty!: number;

  @IsNumber()
  @Min(0)
  purchaseRate!: number;

  @IsNumber()
  @Min(0)
  gstPercent!: number;
}