import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import { Type } from "class-transformer";

export class PurchaseListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsIn([
    "ALL",
    "ACTIVE",
    "CANCELLED",
  ])
  status?: string;

  @IsOptional()
  @IsIn([
    "billDate",
    "billNo",
    "invoiceNo",
    "netAmount",
    "createdAt",
  ])
  sortBy: string = "billDate";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder:
    | "asc"
    | "desc" = "desc";
}