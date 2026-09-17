const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

import { PurchaseListItem } from "../types/purchase-list.types";

import { getStoredToken } from "@/api/token";

function authHeaders(): Record<string, string> {
  const token = getStoredToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

/* =========================================================
   PURCHASE LIST
========================================================= */

export interface PurchaseListResponse {
  data: PurchaseListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PurchaseListQuery {
  page?: number;
  pageSize?: number;
  search?: string;

  supplierId?: string;
  warehouseId?: string;

  status?: string;

  fromDate?: string;
  toDate?: string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/* =========================================================
   LOOKUPS
========================================================= */

export interface SupplierLookup {
  id: string;
  supplierCode: string;
  name: string;
  gstType: string;
  gstin?: string;
}

export interface CreateSupplierDto {
  /*
   * Optional - when omitted, the backend generates one
   * (SUP00001, SUP00002, ...).
   */
  supplierCode?: string;

  name: string;
  gstType: string;

  gstin?: string;
  mobile?: string;
  email?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface WarehouseLookup {
  id: string;
  name: string;
}

export interface BatchLookup {
  id: string;

  batchNo: string;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  expiryDate: string | null;

  manufacturingDate: string | null;
}

export interface ItemLookup {
  id: string;

  itemCode: string;

  name: string;

  barcode: string | null;

  /*
   * Other barcodes recorded against this item's batches (e.g. the
   * same stock re-scanned under a different supplier label) -
   * matched during search so a previously-seen alternate barcode is
   * still found, even though it isn't the item's primary barcode.
   */
  alternateBarcodes: string[];

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  gstPercent: number;

  unit: string;
}

/* =========================================================
   PURCHASE ITEM DTO

   IMPORTANT:
   This MUST match backend
   CreatePurchaseItemDto.

   There is intentionally NO batchId here.
========================================================= */

export interface PurchaseItemDto {
  itemId: string;

  batchNo: string;

  qty: number;

  freeQty?: number;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  barcode?: string;

  expiryDate?: string;

  manufacturingDate?: string;

  discountPercent: number;

  gstPercent: number;
}

/* =========================================================
   CREATE / UPDATE PURCHASE DTO
========================================================= */

export interface CreatePurchaseDto {
  billNo?: string;

  billDate: string;

  supplierId: string;

  warehouseId: string;

  purchaseOrderId?: string;

  invoiceNo?: string;

  invoiceDate?: string;

  billDiscountPercent?: number;

  /*
   * Whether every item's purchaseRate on this bill is entered tax-
   * inclusive or tax-exclusive (default). The backend always
   * converts to, and stores, a tax-exclusive rate - this is purely
   * an input convention for this one bill.
   */
  taxMode?: "EXCLUSIVE" | "INCLUSIVE";

  items: PurchaseItemDto[];
}

/* =========================================================
   PURCHASE LIST API
========================================================= */

export function getPurchaseList(
  query: PurchaseListQuery = {},
) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set(
      "page",
      String(query.page),
    );
  }

  if (query.pageSize) {
    params.set(
      "pageSize",
      String(query.pageSize),
    );
  }

  if (query.search?.trim()) {
    params.set(
      "search",
      query.search.trim(),
    );
  }

  if (query.supplierId) {
    params.set(
      "supplierId",
      query.supplierId,
    );
  }

  if (query.warehouseId) {
    params.set(
      "warehouseId",
      query.warehouseId,
    );
  }

  if (query.status) {
    params.set(
      "status",
      query.status,
    );
  }

  if (query.fromDate) {
    params.set(
      "fromDate",
      query.fromDate,
    );
  }

  if (query.toDate) {
    params.set(
      "toDate",
      query.toDate,
    );
  }

  if (query.sortBy) {
    params.set(
      "sortBy",
      query.sortBy,
    );
  }

  if (query.sortOrder) {
    params.set(
      "sortOrder",
      query.sortOrder,
    );
  }

  return get<PurchaseListResponse>(
    `${API_URL}/purchases?${params.toString()}`,
  );
}

/* =========================================================
   HTTP HELPERS
========================================================= */

async function get<T>(
  url: string,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status})`,
    );
  }

  return response.json();
}

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
    console.error(
      "Backend Error:",
      data,
    );

    throw new Error(
      JSON.stringify(
        data,
        null,
        2,
      ),
    );
  }

  return data;
}

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
    console.error(
      "Backend Error:",
      data,
    );

    throw new Error(
      JSON.stringify(
        data,
        null,
        2,
      ),
    );
  }

  return data;
}

/* =========================================================
   LOOKUPS
========================================================= */

export function getSuppliers() {
  return get<SupplierLookup[]>(
    `${API_URL}/suppliers`,
  );
}

export function createSupplier(
  dto: CreateSupplierDto,
) {
  return post<SupplierLookup>(
    `${API_URL}/suppliers`,
    dto,
  );
}

export function getWarehouses() {
  return get<WarehouseLookup[]>(
    `${API_URL}/warehouses`,
  );
}

export function getItemLookup() {
  return get<ItemLookup[]>(
    `${API_URL}/items/lookup`,
  );
}

export function getBatchesByItem(
  itemId: string,
) {
  return get<BatchLookup[]>(
    `${API_URL}/batches/by-item/${itemId}`,
  );
}

/* =========================================================
   PURCHASE API
========================================================= */

export function createPurchase(
  dto: CreatePurchaseDto,
) {
  return post(
    `${API_URL}/purchases`,
    dto,
  );
}

export function updatePurchase(
  id: string,
  dto: CreatePurchaseDto,
) {
  return put(
    `${API_URL}/purchases/${id}`,
    dto,
  );
}

export function cancelPurchase(
  id: string,
) {
  return post(
    `${API_URL}/purchases/${id}/cancel`,
    {},
  );
}

export function getPurchases() {
  return get(
    `${API_URL}/purchases`,
  );
}

export function getPurchaseById(
  id: string,
) {
  return get<any>(
    `${API_URL}/purchases/${id}`,
  );
}