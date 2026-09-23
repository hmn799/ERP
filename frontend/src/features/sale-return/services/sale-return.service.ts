import { SalesResponse } from "@/features/sales/types/sales.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

/*
 * =====================================================
 * TYPES
 * =====================================================
 */

export type SaleReturnPaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "CREDIT";

export interface CreateSaleReturnItemDto {
  itemId: string;
  batchId: string;
  qty: number;
  saleRate: number;
  gstPercent: number;
}

export interface CreateSaleReturnPaymentDto {
  paymentMode: SaleReturnPaymentMode;
  amount: number;
  transactionNo?: string;
  remarks?: string;
}

export interface CreateSaleReturnDto {
  returnNo?: string;
  returnDate: string;

  /*
   * Omitted for a direct return - one taken back without a
   * previous sales bill on file.
   */
  salesBillId?: string;

  customerId?: string;
  warehouseId: string;

  items: CreateSaleReturnItemDto[];

  payments: CreateSaleReturnPaymentDto[];
}

/*
 * =====================================================
 * GENERIC GET
 * =====================================================
 */

async function get<T>(
  url: string,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data, null, 2),
    );
  }

  return data;
}

/*
 * =====================================================
 * GENERIC POST
 * =====================================================
 */

async function post<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data, null, 2),
    );
  }

  return data;
}

/*
 * =====================================================
 * SALES BILL
 * =====================================================
 */

export function getSalesBillForReturn(
  billId: string,
) {
  return get<SalesResponse>(
    `${API_URL}/sales/${billId}`,
  );
}

/*
 * =====================================================
 * SALE RETURN RESPONSE TYPES
 * =====================================================
 */

export interface SaleReturnItemResponse {
  id: string;

  saleReturnId: string;

  itemId: string;
  batchId: string;

  qty: number | string;

  saleRate: number | string;

  gstPercent: number | string;

  taxableAmount: number | string;

  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;

  netAmount: number | string;

  item?: {
    id?: string;
    itemCode?: string;
    name?: string;
    barcode?: string | null;
  };

  batch?: {
    id?: string;
    batchNo?: string;
  };
}

export interface SaleReturnPaymentResponse {
  id: string;

  saleReturnId: string;

  paymentMode: SaleReturnPaymentMode;

  amount: number | string;

  cardSurcharge: number | string;

  transactionNo?: string | null;

  remarks?: string | null;

  createdAt?: string;
}

export interface SaleReturnResponse {
  id: string;

  returnNo: string;

  returnDate: string;

  salesBillId?: string | null;

  customerId?: string | null;

  warehouseId: string;

  grossAmount: number | string;
  taxableAmount: number | string;

  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;

  netAmount: number | string;

  customer?: {
    id?: string;
    customerCode?: string;
    name?: string;
    gstCategory?: string;
    gstin?: string | null;
  };

  warehouse?: {
    id?: string;
    name?: string;
  };

  salesBill?: {
    id?: string;
    billNo?: string;
    billDate?: string;
  };

  items: SaleReturnItemResponse[];

  payments?: SaleReturnPaymentResponse[];
}

/*
 * =====================================================
 * SALE RETURN LIST RESPONSE
 * =====================================================
 */

interface SaleReturnListResponse {
  value?: SaleReturnResponse[];
  Count?: number;
}

/*
 * =====================================================
 * CREATE SALE RETURN
 * =====================================================
 */

export function createSaleReturn(
  dto: CreateSaleReturnDto,
) {
  return post<SaleReturnResponse>(
    `${API_URL}/sale-returns`,
    dto,
  );
}

/*
 * =====================================================
 * GET ALL SALE RETURNS
 * =====================================================
 */

export async function getSaleReturns() {
  const data = await get<
    | SaleReturnResponse[]
    | SaleReturnListResponse
  >(
    `${API_URL}/sale-returns`,
  );

  if (Array.isArray(data)) {
    return data;
  }

  return data.value ?? [];
}

/*
 * =====================================================
 * GET ONE SALE RETURN
 * =====================================================
 */

export function getSaleReturnById(
  id: string,
) {
  return get<SaleReturnResponse>(
    `${API_URL}/sale-returns/${id}`,
  );
}
