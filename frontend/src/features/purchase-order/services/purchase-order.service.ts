import {
  CreatePurchaseOrderDto,
  PurchaseOrderResponse,
  PurchaseOrderListItem,
  ReceivePurchaseOrderDto,
} from "../types/purchase-order.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

// =========================================================
// RESPONSE PARSER
// =========================================================

async function parseResponse(
  response: Response,
) {
  const text = await response.text();

  let data: any = null;

  if (text.trim() !== "") {
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error(
        "Invalid JSON response:",
        text,
      );

      throw new Error(
        `Invalid JSON response from server: ${text}`,
      );
    }
  }

  if (!response.ok) {
    console.error(
      "Backend Error:",
      data ?? text,
    );

    throw new Error(
      typeof data === "string"
        ? data
        : JSON.stringify(
            data ?? {
              statusCode:
                response.status,
              message:
                response.statusText,
            },
            null,
            2,
          ),
    );
  }

  return data;
}

// =========================================================
// HTTP GET
// =========================================================

async function get<T>(
  url: string,
): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseResponse(
    response,
  );

  return data as T;
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

  const data = await parseResponse(
    response,
  );

  return data as T;
}

// =========================================================
// PURCHASE ORDERS
// =========================================================

export function getPurchaseOrders() {
  return get<PurchaseOrderListItem[]>(
    `${API_URL}/purchase-order`,
  );
}

// =========================================================
// GET ONE PURCHASE ORDER
// =========================================================

export function getPurchaseOrderById(
  id: string,
) {
  return get<PurchaseOrderResponse>(
    `${API_URL}/purchase-order/${id}`,
  );
}

// =========================================================
// CREATE PURCHASE ORDER
// =========================================================

export function createPurchaseOrder(
  dto: CreatePurchaseOrderDto,
) {
  return post<PurchaseOrderResponse>(
    `${API_URL}/purchase-order`,
    dto,
  );
}

// =========================================================
// RECEIVE PURCHASE ORDER
// =========================================================

export function receivePurchaseOrder(
  id: string,
  dto: ReceivePurchaseOrderDto,
) {
  return post<PurchaseOrderResponse>(
    `${API_URL}/purchase-order/${id}/receive`,
    dto,
  );
}

// =========================================================
// CANCEL PURCHASE ORDER
// =========================================================

export function cancelPurchaseOrder(
  id: string,
) {
  return post<PurchaseOrderResponse>(
    `${API_URL}/purchase-order/${id}/cancel`,
    {},
  );
}
