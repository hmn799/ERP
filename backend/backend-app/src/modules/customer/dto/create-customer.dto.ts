import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateCustomerDto {
  /*
   * Optional - when omitted, CustomerService.create() generates one
   * (CUS00001, CUS00002, ...). Still accepted when supplied, so
   * existing callers (e.g. bulk import) keep working unchanged.
   */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerCode?: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  customerGroup: string;

  @IsOptional()
  @IsString()
  priceLevel?: string;

  @IsOptional()
  @IsString()
  priceListId?: string;

  @IsString()
  gstCategory: string;

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
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  salesmanId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}