export interface Receipt {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  amount: number;
  remarks?: string | null;
}

export interface CreateReceiptDto {
  customerId: string;
  amount: number;
  receiptDate: string;
  remarks?: string;
}

export interface Payment {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  amount: number;
  remarks?: string | null;
}

export interface CreatePaymentDto {
  supplierId: string;
  amount: number;
  paymentDate: string;
  remarks?: string;
}

export interface LedgerRow {
  date: string;
  type: string;
  referenceId?: string | null;
  debit: number;
  credit: number;
  balance: number;
  remarks?: string | null;
}
