export interface Supplier {
  id: string;

  supplierCode: string;

  name: string;

  gstType: string;

  gstin?: string;

  mobile?: string;

  email?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  openingBalance: number;

  isActive: boolean;
}

export interface CreateSupplierDto {
  /*
   * Optional - when omitted, the backend generates one
   * (SUP00001, SUP00002, ...).
   */
  supplierCode?: string;

  name: string;

  gstType: string;

  gstin?: string;

  mobile?: string;

  email?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  openingBalance?: number;

  isActive?: boolean;
}