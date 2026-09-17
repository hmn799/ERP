export interface Customer {
  id: string;

  customerCode: string;

  name: string;

  customerGroup: string;

  priceLevel?: string;

  priceListId?: string;

  gstCategory: string;

  gstin?: string;

  mobile?: string;

  email?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  openingBalance: number;

  creditLimit: number;

  routeId?: string;

  salesmanId?: string;

  isActive: boolean;
}

export interface CreateCustomerDto {
  /*
   * Optional - when omitted, the backend generates one
   * (CUS00001, CUS00002, ...).
   */
  customerCode?: string;

  name: string;

  customerGroup: string;

  priceLevel?: string;

  priceListId?: string;

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

  isActive?: boolean;
}   