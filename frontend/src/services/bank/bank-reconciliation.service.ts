import apiClient from "@/api/client";

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  transactionDate: string;
  description: string;
  referenceNo: string | null;
  debitAmount: number;
  creditAmount: number;
  status: "UNMATCHED" | "MATCHED" | "IGNORED";
  matchedLedgerEntryId: string | null;
  source: "MANUAL" | "IMPORTED";
  createdAt: string;
}

export interface BankTransactionPage {
  items: BankTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MatchSuggestion {
  ledgerEntryId: string;
  transactionDate: string;
  partyType: string;
  partyId: string;
  partyName: string;
  amount: number;
  remarks: string | null;
  daysApart: number;
}

export interface ReconciliationSummary {
  bankAccountId: string;
  openingBalance: number;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  transactionCount: number;
  matchedCount: number;
  unmatchedCount: number;
  ignoredCount: number;
  unmatchedCredits: number;
  unmatchedDebits: number;
}

export interface CreateBankTransactionDto {
  bankAccountId: string;
  transactionDate: string;
  description: string;
  referenceNo?: string;
  debitAmount?: number;
  creditAmount?: number;
}

export interface ImportRow {
  transactionDate: string;
  description: string;
  referenceNo?: string;
  debitAmount?: number;
  creditAmount?: number;
}

export const BankReconciliationService = {
  async listTransactions(
    bankAccountId: string,
    status?: string,
    page = 1,
    pageSize = 50,
  ): Promise<BankTransactionPage> {
    const { data } = await apiClient.get(
      "/bank-reconciliation/transactions",
      { params: { bankAccountId, status, page, pageSize } },
    );
    return data;
  },

  async addTransaction(
    dto: CreateBankTransactionDto,
  ): Promise<BankTransaction> {
    const { data } = await apiClient.post(
      "/bank-reconciliation/transactions",
      dto,
    );
    return data;
  },

  async importTransactions(
    bankAccountId: string,
    rows: ImportRow[],
  ): Promise<{ imported: number }> {
    const { data } = await apiClient.post(
      "/bank-reconciliation/transactions/import",
      { bankAccountId, rows },
    );
    return data;
  },

  async suggestions(
    bankTransactionId: string,
  ): Promise<MatchSuggestion[]> {
    const { data } = await apiClient.get(
      `/bank-reconciliation/transactions/${bankTransactionId}/suggestions`,
    );
    return data;
  },

  async confirmMatch(
    bankTransactionId: string,
    ledgerEntryId: string,
  ): Promise<BankTransaction> {
    const { data } = await apiClient.post(
      `/bank-reconciliation/transactions/${bankTransactionId}/match`,
      { ledgerEntryId },
    );
    return data;
  },

  async unmatch(
    bankTransactionId: string,
  ): Promise<BankTransaction> {
    const { data } = await apiClient.post(
      `/bank-reconciliation/transactions/${bankTransactionId}/unmatch`,
    );
    return data;
  },

  async ignore(
    bankTransactionId: string,
  ): Promise<BankTransaction> {
    const { data } = await apiClient.post(
      `/bank-reconciliation/transactions/${bankTransactionId}/ignore`,
    );
    return data;
  },

  async summary(
    bankAccountId: string,
  ): Promise<ReconciliationSummary> {
    const { data } = await apiClient.get(
      "/bank-reconciliation/summary",
      { params: { bankAccountId } },
    );
    return data;
  },
};

export default BankReconciliationService;
