import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { SchemeType } from '@prisma/client';

export class CreateSchemeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsEnum(SchemeType)
  schemeType!: SchemeType;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  buyQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  freeQty?: number;

  @IsOptional()
  @IsString()
  freeItemId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
