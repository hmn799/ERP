export class CreateCustomerDto {
  customerCode: string;

  name: string;

  customerGroup: string;

  priceLevel: string;

  gstCategory: string;

  gstin?: string;

  mobile?: string;
  email?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  openingBalance?: number;

  creditLimit?: number;

  routeId?: string;

  salesmanId?: string;
}