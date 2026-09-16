import {
  IsArray,
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { Type } from "class-transformer";

import { CreatePurchaseItemDto } from "./create-purchase-item.dto";

export class CreatePurchaseDto {
  @IsOptional()
  @IsString()
  billNo?: string;

  @Type(() => Date)
  @IsDate()
  billDate!: Date;

  @IsString()
  supplierId!: string;

  @IsString()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  invoiceDate?: Date;

  @IsOptional()
  @IsNumber()
  billDiscountPercent?: number;

  /*
   * Whether every item's purchaseRate on this bill is entered tax-
   * inclusive or tax-exclusive (default). Purely an input
   * convention - purchaseRate is always converted to, and stored
   * as, a tax-exclusive rate before anything else in the app sees
   * it.
   */
  @IsOptional()
  @IsIn(['EXCLUSIVE', 'INCLUSIVE'])
  taxMode?: 'EXCLUSIVE' | 'INCLUSIVE';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];
}