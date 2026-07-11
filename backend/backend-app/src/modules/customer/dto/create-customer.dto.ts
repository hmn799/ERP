import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateCustomerDto {
  @IsString()
  @MaxLength(30)
  customerCode: string;

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