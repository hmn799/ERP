import apiClient from "@/api/client";

export interface DashboardFastMovingItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  qtySold: number;
  salesValue: number;
}

export interface DashboardSummary {
  totalSales: number;
  totalPurchase: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  stockItems: number;
  stockQty: number;
  totalProfit: number;
  deadStockItems: number;
  fastMovingItems: DashboardFastMovingItem[];
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
}

export interface LowStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  stock: number;
}

export interface SalesRegisterRow {
  salesBillId: string;
  billNo: string;
  billDate: string;
  customerCode: string;
  customerName: string;
  salesman?: string;
  warehouse?: string;
  grossAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
  isCredit: boolean;
}

export interface ItemSalesRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  qtySold: number;
  salesValue: number;
}

export interface PartySalesRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  billCount: number;
  salesValue: number;
}

export interface PurchaseRegisterRow {
  purchaseBillId: string;
  billNo: string;
  billDate: string;
  supplierCode: string;
  supplierName: string;
  warehouse?: string;
  grossAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
}

export interface StockRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  stock: number;
}

export interface BatchStockRow {
  itemCode: string;
  itemName: string;
  batchId: string;
  batchNo: string;
  mrp: number;
  purchaseRate: number;
  stock: number;
  expiryDate: string | null;
}

export interface StockValuationRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  stock: number;
  purchaseRate: number;
  stockValue: number;
}

export interface StockValuationReport {
  items: StockValuationRow[];
  totalStockValue: number;
}

export interface StockLedgerRow {
  date: string;
  itemCode: string;
  itemName: string;
  batchNo: string;
  warehouse: string;
  transactionType: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
}

export interface ProfitRow {
  itemCode: string;
  itemName: string;
  batchNo: string;
  qty: number;
  saleRate: number;
  saleValue: number;
  purchaseRate: number;
  costValue: number;
  profit: number;
}

export interface CashBookRow {
  date: string;
  partyType: string;
  partyId: string;
  partyName: string;
  type: string;
  receipt: number;
  payment: number;
  balance: number;
  remarks?: string | null;
}

export interface BankBookRow {
  date: string;
  partyType: string;
  partyId: string;
  partyName: string;
  type: string;
  deposit: number;
  withdrawal: number;
  balance: number;
  remarks?: string | null;
}

export interface GstSummary {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  salesCount: number;
  purchaseCount: number;
}

export interface Gstr1B2BRow {
  billNo: string;
  billDate: string;
  customerName: string;
  gstin: string;
  placeOfSupply: string;
  invoiceValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Gstr1B2CLargeRow {
  billNo: string;
  billDate: string;
  placeOfSupply: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
}

export interface Gstr1B2CSmallRow {
  placeOfSupply: string;
  ratePercent: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Gstr1HsnRow {
  hsnCode: string;
  qty: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Gstr1Report {
  period: string;
  company: { gstin: string | null; legalName: string | null };
  summary: {
    totalInvoices: number;
    totalTaxableValue: number;
    totalTax: number;
    totalInvoiceValue: number;
  };
  b2b: Gstr1B2BRow[];
  b2cLarge: Gstr1B2CLargeRow[];
  b2cSmall: Gstr1B2CSmallRow[];
  hsnSummary: Gstr1HsnRow[];
  notes: string[];
}

export interface Gstr3bTaxLine {
  taxableValue: number;
  igst: number;
  cgst?: number;
  sgst?: number;
}

export interface Gstr3bReport {
  period: string;
  company: { gstin: string | null; legalName: string | null };
  section3_1OutwardSupplies: {
    taxableOutwardSupplies: Gstr3bTaxLine;
    zeroRatedSupplies: { taxableValue: number; igst: number };
    otherOutwardSupplies: { taxableValue: number };
    inwardSuppliesReverseCharge: Gstr3bTaxLine;
    nonGstOutwardSupplies: { taxableValue: number };
  };
  section4EligibleItc: {
    allOtherItc: Gstr3bTaxLine;
    itcReversed: { igst: number; cgst: number; sgst: number };
    netEligibleItc: { igst: number; cgst: number; sgst: number };
  };
  section6_1TaxPayable: { igst: number; cgst: number; sgst: number };
  notes: string[];
}

export const ReportsService = {
  async getDashboard(): Promise<DashboardSummary> {
    const { data } = await apiClient.get(
      "/reports/dashboard",
    );
    return data;
  },

  async getSalesTrend(
    days = 14,
  ): Promise<SalesTrendPoint[]> {
    const { data } = await apiClient.get(
      "/reports/sales-trend",
      { params: { days } },
    );
    return data;
  },

  async getLowStockReport(): Promise<LowStockItem[]> {
    const { data } = await apiClient.get(
      "/reports/low-stock-report",
    );
    return data;
  },

  async getSalesRegister(): Promise<
    SalesRegisterRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/sales-register",
    );
    return data;
  },

  async getItemSalesReport(): Promise<
    ItemSalesRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/item-sales-report",
    );
    return data;
  },

  async getPartySalesReport(): Promise<
    PartySalesRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/party-sales-report",
    );
    return data;
  },

  async getPurchaseRegister(): Promise<
    PurchaseRegisterRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/purchase-register",
    );
    return data;
  },

  async getStockReport(): Promise<StockRow[]> {
    const { data } = await apiClient.get(
      "/reports/stock-report",
    );
    return data;
  },

  async getBatchStockReport(): Promise<
    BatchStockRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/batch-stock-report",
    );
    return data;
  },

  async getStockValuationReport(): Promise<
    StockValuationReport
  > {
    const { data } = await apiClient.get(
      "/reports/stock-valuation-report",
    );
    return data;
  },

  async getStockLedgerReport(): Promise<
    StockLedgerRow[]
  > {
    const { data } = await apiClient.get(
      "/reports/stock-ledger-report",
    );
    return data;
  },

  async getProfitReport(): Promise<ProfitRow[]> {
    const { data } = await apiClient.get(
      "/reports/profit-report",
    );
    return data;
  },

  async getCashBook(
    from: string,
    to: string,
  ): Promise<CashBookRow[]> {
    const { data } = await apiClient.get(
      "/reports/cash-book",
      { params: { from, to } },
    );
    return data;
  },

  async getBankBook(
    bankAccountId: string,
    from: string,
    to: string,
  ): Promise<BankBookRow[]> {
    const { data } = await apiClient.get(
      "/reports/bank-book",
      { params: { bankAccountId, from, to } },
    );
    return data;
  },

  async getGstSummary(): Promise<GstSummary> {
    const { data } = await apiClient.get(
      "/reports/gst-summary",
    );
    return data;
  },

  async getGstr1(month?: string): Promise<Gstr1Report> {
    const { data } = await apiClient.get(
      "/reports/gstr1",
      { params: month ? { month } : undefined },
    );
    return data;
  },

  async getGstr3b(month?: string): Promise<Gstr3bReport> {
    const { data } = await apiClient.get(
      "/reports/gstr3b",
      { params: month ? { month } : undefined },
    );
    return data;
  },
};

export default ReportsService;
