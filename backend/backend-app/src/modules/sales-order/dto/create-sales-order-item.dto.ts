import {
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateSalesOrderItemDto {
  @IsString()
  itemId: string;

  @IsNumber()
  @Min(0.01)
  qtyOrdered: number;

  @IsNumber()
  @Min(0)
  saleRate: number;

  @IsNumber()
  @Min(0)
  discountPercent: number;

  @IsNumber()
  @Min(0)
  gstPercent: number;
}
