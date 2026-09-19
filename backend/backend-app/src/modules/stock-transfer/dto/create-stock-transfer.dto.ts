import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { CreateStockTransferItemDto } from "./create-stock-transfer-item.dto";

export class CreateStockTransferDto {
  @IsDateString()
  transferDate!: string;

  @IsString()
  fromWarehouseId!: string;

  @IsString()
  toWarehouseId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  items!: CreateStockTransferItemDto[];
}
