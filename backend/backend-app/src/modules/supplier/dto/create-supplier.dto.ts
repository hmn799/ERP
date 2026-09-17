import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateSupplierDto {
  /*
   * Optional - when omitted, SupplierService.create() generates one
   * (SUP00001, SUP00002, ...). Still accepted when supplied, so
   * existing callers (e.g. bulk import) keep working unchanged.
   */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  supplierCode?: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  gstType: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}