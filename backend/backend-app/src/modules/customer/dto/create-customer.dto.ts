import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

const CUSTOMER_GROUPS = [
  "RETAIL",
  "WHOLESALE",
  "DISTRIBUTOR",
] as const;

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

  /*
   * RETAIL (Rate A) | WHOLESALE (Rate B, shown to the operator as
   * "Semi Wholesale") | DISTRIBUTOR (Rate C, shown as "Wholesale") -
   * this is also what sales-calculation.service.ts reads (as
   * priceLevel, kept in sync below) to pick which batch rate column
   * applies to this customer's sales.
   */
  @IsIn(CUSTOMER_GROUPS)
  customerGroup: string;

  @IsOptional()
  @IsIn(CUSTOMER_GROUPS)
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