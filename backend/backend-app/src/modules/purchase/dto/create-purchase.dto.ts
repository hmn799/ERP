import {
  IsArray,
  IsDate,
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];
}