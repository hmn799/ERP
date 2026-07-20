const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

export interface SupplierLookup {
  id: string;
  supplierCode: string;
  name: string;
  gstType: string;
  gstin?: string;
}

export interface WarehouseLookup {
  id: string;
  name: string;
}

export interface ItemLookup {
  id: string;

  itemCode: string;

  name: string;

  barcode: string | null;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  gstPercent: number;

  unit: string;
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status})`,
    );
  }

  return response.json();
}

export function getSuppliers() {
  return get<SupplierLookup[]>(
    `${API_URL}/suppliers`,
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