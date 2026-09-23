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
import { Transform } from 'class-transformer';

import { SchemeType } from '@prisma/client';

/*
 * "" (the date input cleared) becomes null - explicitly clear the
 * date on update - rather than failing @IsDateString(), which
 * @IsOptional() only skips for null/undefined, not "".
 */
const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

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
  @Transform(emptyToNull)
  @IsDateString()
  effectiveFrom?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsDateString()
  effectiveTo?: string | null;
}
