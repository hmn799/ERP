export class CreateSupplierDto {
  supplierCode!: string;

  name!: string;

  gstType!: string;

  gstin?: string;

  mobile?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  openingBalance?: number;
}