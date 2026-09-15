import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreateSaleReturnItemDto } from './create-sale-return-item.dto';
import { CreateSaleReturnPaymentDto } from './create-sale-return-payment.dto';

export class CreateSaleReturnDto {
  @IsOptional()
  @IsString()
  returnNo!: string;

  @IsDateString()
  returnDate!: string;

  @IsString()
  salesBillId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  warehouseId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleReturnItemDto)
  items!: CreateSaleReturnItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleReturnPaymentDto)
  payments?: CreateSaleReturnPaymentDto[];
}
