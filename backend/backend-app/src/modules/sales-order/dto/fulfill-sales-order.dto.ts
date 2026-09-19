import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class FulfillSalesOrderItemDto {
  @IsString()
  salesOrderItemId: string;

  @IsString()
  batchId: string;

  @IsNumber()
  @Min(0.0001)
  qty: number;
}

export class FulfillSalesOrderDto {
  @IsOptional()
  @IsDateString()
  billDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FulfillSalesOrderItemDto)
  items: FulfillSalesOrderItemDto[];
}
