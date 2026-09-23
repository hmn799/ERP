import apiClient from "@/api/client";

export interface PettyExpense {
  id: string;
  expenseNo: string;
  expenseDate: string;
  category: string;
  amount: number | string;
  paymentMode: string;
  remarks?: string | null;
}

export interface PettyExpenseRecent {
  entries: PettyExpense[];
  todayTotal: number;
  todayCount: number;
}

export interface CreatePettyExpenseDto {
  category: string;
  amount: number;
  paymentMode?: "CASH" | "UPI" | "CARD";
  remarks?: string;
}

const PettyExpenseService = {
  async recent(limit = 6): Promise<PettyExpenseRecent> {
    const { data } = await apiClient.get(
      `/petty-expenses/recent?limit=${limit}`,
    );
    return data;
  },

  async create(
    dto: CreatePettyExpenseDto,
  ): Promise<PettyExpense> {
    const { data } = await apiClient.post(
      "/petty-expenses",
      dto,
    );
    return data;
  },
};

export default PettyExpenseService;
