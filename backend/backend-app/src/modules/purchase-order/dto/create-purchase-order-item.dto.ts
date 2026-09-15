import {
  IsNumber,
  IsString,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsString()
  itemId: string;

  @IsNumber()
  qtyOrdered: number;

  @IsNumber()
  purchaseRate: number;

  @IsNumber()
  discountPercent: number;

  @IsNumber()
  gstPercent: number;
}
