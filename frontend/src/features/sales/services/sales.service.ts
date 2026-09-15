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

export interface CustomerPartyPrice {
  id: string;
  itemId: string;
  salePrice: number | string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

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
      },
      body: JSON.stringify(dto),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data, null, 2),
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
      JSON.stringify(data, null, 2),
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
    throw new Error(JSON.stringify(data, null, 2));
  }

  return data as CustomerPartyPrice;
}
