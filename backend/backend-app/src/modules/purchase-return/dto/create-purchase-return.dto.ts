import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { Type } from "class-transformer";

import { CreatePurchaseReturnItemDto } from "./create-purchase-return-item.dto";

export class CreatePurchaseReturnDto {
  @IsOptional()
  @IsString()
  returnNo?: string;

  @Type(() => Date)
  @IsDate()
  returnDate!: Date;

  @IsString()
  purchaseBillId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items!: CreatePurchaseReturnItemDto[];
}