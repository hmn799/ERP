import apiClient from "@/api/client";

import type {
  CreatePaymentDto,
  CreateReceiptDto,
  LedgerRow,
  Payment,
  Receipt,
} from "@/features/accounts/types/ledger.types";

export const LedgerService = {
  async listReceipts(): Promise<Receipt[]> {
    const { data } = await apiClient.get(
      "/ledger/receipts",
    );
    return data;
  },

  async createReceipt(
    dto: CreateReceiptDto,
  ): Promise<Receipt> {
    const { data } = await apiClient.post(
      "/ledger/receipt",
      dto,
    );
    return data;
  },

  async listPayments(): Promise<Payment[]> {
    const { data } = await apiClient.get(
      "/ledger/payments",
    );
    return data;
  },

  async createPayment(
    dto: CreatePaymentDto,
  ): Promise<Payment> {
    const { data } = await apiClient.post(
      "/ledger/payment",
      dto,
    );
    return data;
  },

  async getCustomerOutstanding(
    customerId: string,
  ): Promise<number> {
    const { data } = await apiClient.get(
      `/ledger/customer/${customerId}/outstanding`,
    );
    return data.outstanding;
  },

  async getSupplierOutstanding(
    supplierId: string,
  ): Promise<number> {
    const { data } = await apiClient.get(
      `/ledger/supplier/${supplierId}/outstanding`,
    );
    return data.outstanding;
  },

  async getCustomerLedger(
    customerId: string,
  ): Promise<LedgerRow[]> {
    const { data } = await apiClient.get(
      `/reports/customer-ledger/${customerId}`,
    );
    return data;
  },

  async getSupplierLedger(
    supplierId: string,
  ): Promise<LedgerRow[]> {
    const { data } = await apiClient.get(
      `/reports/supplier-ledger/${supplierId}`,
    );
    return data;
  },
};

export default LedgerService;
