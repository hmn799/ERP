export interface CompanyProfile {
  id: string;

  name: string;

  gstin?: string | null;

  address?: string | null;

  phone?: string | null;

  email?: string | null;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface UpdateCompanyDto {
  name: string;

  gstin?: string;

  address?: string;

  phone?: string;

  email?: string;
}
