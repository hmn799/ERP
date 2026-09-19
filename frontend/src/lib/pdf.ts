import apiClient from "@/api/client";

function apiBaseUrl(): string {
  return (
    apiClient.defaults.baseURL ?? "http://localhost:3001/api"
  );
}

export function openInvoicePdf(salesBillId: string) {
  window.open(
    `${apiBaseUrl()}/sales/${salesBillId}/invoice-pdf`,
    "_blank",
  );
}

export function openCustomerStatementPdf(
  customerId: string,
  from: string,
  to: string,
) {
  window.open(
    `${apiBaseUrl()}/reports/customer-statement/${customerId}/pdf?from=${from}&to=${to}`,
    "_blank",
  );
}

export function openSupplierStatementPdf(
  supplierId: string,
  from: string,
  to: string,
) {
  window.open(
    `${apiBaseUrl()}/reports/supplier-statement/${supplierId}/pdf?from=${from}&to=${to}`,
    "_blank",
  );
}
