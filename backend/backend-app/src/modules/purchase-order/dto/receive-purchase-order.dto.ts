import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ReceivePurchaseOrderItemDto {
  @IsString()
  purchaseOrderItemId: string;

  @IsNumber()
  @Min(0.0001)
  qtyReceived: number;

  @IsString()
  batchNo: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsNumber()
  purchaseRate?: number;

  @IsOptional()
  @IsNumber()
  retailRate?: number;

  @IsOptional()
  @IsNumber()
  wholesaleRate?: number;

  @IsOptional()
  @IsNumber()
  distributorRate?: number;

  @IsOptional()
  @IsNumber()
  mrp?: number;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class ReceivePurchaseOrderDto {
  @IsOptional()
  @IsString()
  billNo?: string;

  @IsOptional()
  @IsDateString()
  billDate?: string;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items: ReceivePurchaseOrderItemDto[];
}
