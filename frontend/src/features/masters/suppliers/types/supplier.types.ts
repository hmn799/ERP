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

  openingBalance?: number;

  isActive?: boolean;
}