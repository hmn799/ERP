import {
  CreatePurchaseReturnDto,
  PurchaseReturnableResponse,
  PurchaseReturnResponse,
} from "../types/purchase-return.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

// =========================================================
// HTTP GET
// =========================================================

async function get<T>(
  url: string,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
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

// =========================================================
// HTTP POST
// =========================================================

async function post<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json",
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

// =========================================================
// PURCHASE RETURNABLE
// =========================================================

export function getPurchaseReturnable(
  purchaseBillId: string,
) {
  return get<PurchaseReturnableResponse>(
    `${API_URL}/purchase-returns/purchase-bill/${purchaseBillId}`,
  );
}

// =========================================================
// CREATE PURCHASE RETURN
// =========================================================

export function createPurchaseReturn(
  dto: CreatePurchaseReturnDto,
) {
  return post<PurchaseReturnResponse>(
    `${API_URL}/purchase-returns`,
    dto,
  );
}

// =========================================================
// GET ALL PURCHASE RETURNS
// =========================================================

export function getPurchaseReturns() {
  return get<PurchaseReturnResponse[]>(
    `${API_URL}/purchase-returns`,
  );
}

// =========================================================
// GET ONE PURCHASE RETURN
// =========================================================

export function getPurchaseReturnById(
  id: string,
) {
  return get<PurchaseReturnResponse>(
    `${API_URL}/purchase-returns/${id}`,
  );
}

// =========================================================
// CANCEL PURCHASE RETURN
// =========================================================

export function cancelPurchaseReturn(
  id: string,
) {
  return post<PurchaseReturnResponse>(
    `${API_URL}/purchase-returns/${id}/cancel`,
    {},
  );
}