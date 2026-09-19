export const DOCUMENT_TYPES = [
  { value: "PO", label: "Purchase Order" },
  { value: "PB", label: "Purchase Bill" },
  { value: "SO", label: "Sales Order" },
  { value: "SI", label: "Sales Invoice" },
  { value: "SB", label: "Sales Bill" },
  { value: "PR", label: "Purchase Return" },
  { value: "SR", label: "Sales Return" },
  { value: "RC", label: "Receipt" },
  { value: "PY", label: "Payment" },
  { value: "JV", label: "Journal" },
  { value: "CN", label: "Contra" },
  { value: "EX", label: "Expense" },
  { value: "BATCH", label: "Batch Number" },
  { value: "ST", label: "Stock Transfer" },
] as const;

export interface DocumentSeries {
  id: string;
  documentType: string;
  name: string;
  prefix: string;
  suffix?: string | null;
  padding: number;
  currentNumber: number;
  resetYearly: boolean;
  financialYear?: string | null;
  isActive: boolean;
}

export interface CreateDocumentSeriesDto {
  documentType: string;
  name: string;
  prefix: string;
  suffix?: string;
  padding: number;
  currentNumber: number;
  resetYearly: boolean;
  financialYear?: string;
  isActive: boolean;
}
