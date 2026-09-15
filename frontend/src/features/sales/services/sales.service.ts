import {
  CreateCustomerDto,
  CreateSalesDto,
  CustomerLedgerEntry,
  CustomerLookup,
  HeldSale,
  SalesBatchLookup,
  SalesItemLookup,
  SalesListItem,
  SalesResponse,
  WarehouseLookup,
} from "../types/sales.types";

import { getStoredToken } from "@/api/token";

export interface CustomerPartyPrice {
  id: string;
  itemId: string;
  salePrice: number | string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

function authHeaders(): Record<string, string> {
  const token = getStoredToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function friendlyMessage(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "message" in data
  ) {
    const message = (
      data as { message: unknown }
    ).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return JSON.stringify(data, null, 2);
}

/*
 * =====================================================
 * GET
 * =====================================================
 */

async function get<T>(
  url: string,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      friendlyMessage(data),
    );
  }

  return data;
}

/*
 * =====================================================
 * POST
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
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      friendlyMessage(data),
    );
  }

  return data;
}

/*
 * =====================================================
 * PUT
 * =====================================================
 */

async function put<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      friendlyMessage(data),
    );
  }

  return data;
}

/*
 * =====================================================
 * SALES
 * =====================================================
 */

export function getSales() {
  return get<SalesListItem[]>(
    `${API_URL}/sales`,
  );
}

export function getSaleById(
  id: string,
) {
  return get<SalesResponse>(
    `${API_URL}/sales/${id}`,
  );
}

export function createSale(
  dto: CreateSalesDto,
) {
  return post<SalesResponse>(
    `${API_URL}/sales`,
    dto,
  );
}

export interface SalesPreviewItem {
  itemId: string;
  batchId: string;
  qty: number;
  freeQty: number;
  schemeId: string | null;
  saleRate: number;
  discountPercent: number;
  gstPercent: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
}

export interface SalesPreview {
  items: SalesPreviewItem[];
  grossAmount: number;
  itemDiscountAmount: number;
  billDiscountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
  roundOff: number;
  shortAmount: number;
  finalPayable: number;
}

export function previewSale(
  dto: CreateSalesDto,
) {
  return post<SalesPreview>(
    `${API_URL}/sales/preview`,
    dto,
  );
}

/*
 * =====================================================
 * UPDATE SALE
 * =====================================================
 */

export async function updateSale(
  id: string,
  dto: CreateSalesDto,
) {
  const response = await fetch(
    `${API_URL}/sales/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(dto),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      friendlyMessage(data),
    );
  }

  return data as SalesResponse;
}

/*
 * =====================================================
 * HELD BILLS
 * =====================================================
 */

export function getHeldSales() {
  return get<HeldSale[]>(
    `${API_URL}/sales/holds`,
  );
}

export function holdSale(
  dto: CreateSalesDto & { holdName?: string },
) {
  return post<HeldSale>(
    `${API_URL}/sales/holds`,
    dto,
  );
}

export async function deleteHeldSale(
  id: string,
) {
  const response = await fetch(
    `${API_URL}/sales/holds/${id}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      friendlyMessage(data),
    );
  }
}

/*
 * =====================================================
 * CUSTOMER
 * =====================================================
 */

export function getCustomers() {
  return get<CustomerLookup[]>(
    `${API_URL}/customers`,
  );
}

export function createCustomer(
  dto: CreateCustomerDto,
) {
  return post<CustomerLookup>(
    `${API_URL}/customers`,
    dto,
  );
}

export function getCustomerLedger(
  customerId: string,
) {
  return get<CustomerLedgerEntry[]>(
    `${API_URL}/ledger/customer/${customerId}`,
  );
}

/*
 * =====================================================
 * WAREHOUSE
 * =====================================================
 */

export function getWarehouses() {
  return get<WarehouseLookup[]>(
    `${API_URL}/warehouses`,
  );
}

/*
 * =====================================================
 * ITEM
 * =====================================================
 */

export function getItemLookup() {
  return get<SalesItemLookup[]>(
    `${API_URL}/items/lookup`,
  );
}

/*
 * =====================================================
 * BATCH
 * =====================================================
 */

export function getBatches() {
  return get<SalesBatchLookup[]>(
    `${API_URL}/batches`,
  );
}

export function getCustomerPartyPrices(
  customerId: string,
) {
  return get<CustomerPartyPrice[]>(
    `${API_URL}/party-price/customer/${customerId}`,
  );
}

export async function saveCustomerPartyPrice(
  customerId: string,
  itemId: string,
  salePrice: number,
  existingPrice?: CustomerPartyPrice,
) {
  const url = existingPrice
    ? `${API_URL}/party-price/${existingPrice.id}`
    : `${API_URL}/party-price`;

  const response = await fetch(url, {
    method: existingPrice ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(
      existingPrice
        ? { salePrice, isActive: true }
        : {
            customerId,
            itemId,
            salePrice,
            isActive: true,
          },
    ),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(friendlyMessage(data));
  }

  return data as CustomerPartyPrice;
}
