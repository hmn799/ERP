import apiClient from "@/api/client";

export interface CreateFinancialYearDto {
  name: string;
  startDate: string;
  endDate: string;
}

export interface FinancialYearClosingBalance {
  id: string;
  partyType: "CUSTOMER" | "SUPPLIER";
  partyId: string;
  partyName: string;
  closingBalance: number | string;
}

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  closedAt: string | null;
  createdAt: string;
  closingBalances?: FinancialYearClosingBalance[];
}

export const FinancialYearService = {
  async list(): Promise<FinancialYear[]> {
    const { data } = await apiClient.get("/financial-years");
    return data;
  },

  async get(id: string): Promise<FinancialYear> {
    const { data } = await apiClient.get(`/financial-years/${id}`);
    return data;
  },

  async create(dto: CreateFinancialYearDto): Promise<FinancialYear> {
    const { data } = await apiClient.post("/financial-years", dto);
    return data;
  },

  async close(id: string): Promise<FinancialYear> {
    const { data } = await apiClient.post(`/financial-years/${id}/close`);
    return data;
  },

  async reopen(id: string): Promise<FinancialYear> {
    const { data } = await apiClient.post(`/financial-years/${id}/reopen`);
    return data;
  },
};

export default FinancialYearService;
