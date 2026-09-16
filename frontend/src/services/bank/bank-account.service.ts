import apiClient from "@/api/client";

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string | null;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountDto {
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  openingBalance?: number;
}

export interface UpdateBankAccountDto {
  name?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  openingBalance?: number;
  isActive?: boolean;
}

export const BankAccountService = {
  async getAll(): Promise<BankAccount[]> {
    const { data } = await apiClient.get("/bank-accounts");
    return data;
  },

  async create(dto: CreateBankAccountDto): Promise<BankAccount> {
    const { data } = await apiClient.post(
      "/bank-accounts",
      dto,
    );
    return data;
  },

  async update(
    id: string,
    dto: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    const { data } = await apiClient.patch(
      `/bank-accounts/${id}`,
      dto,
    );
    return data;
  },
};

export default BankAccountService;
