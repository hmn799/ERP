import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreateSalesItemDto } from './create-sales-item.dto';
import { CreateSalesPaymentDto } from './create-sales-payment.dto';

export class UpdateSalesDto {
  @IsOptional()
  @IsString()
  billNo?: string;

  @IsDateString()
  billDate!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  salesmanId?: string;

  @IsOptional()
  @IsBoolean()
  isCredit?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  billDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  roundOff?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shortAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesPaymentDto)
  payments?: CreateSalesPaymentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesItemDto)
  items!: CreateSalesItemDto[];
}