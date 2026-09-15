const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

export interface BatchStockResponse {
  batchId: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
}

// =====================================================
// GET ALL STOCK FOR WAREHOUSE
// =====================================================

export async function getWarehouseStocks(
  warehouseId: string,
): Promise<BatchStockResponse[]> {
  if (!warehouseId) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/sales/stock/${warehouseId}`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load warehouse stock.',
    );
  }

  return (await response.json()) as BatchStockResponse[];
}

// =====================================================
// GET STOCK FOR ONE BATCH
// =====================================================

export async function getBatchStock(
  warehouseId: string,
  batchId: string,
): Promise<BatchStockResponse | null> {
  if (
    !warehouseId ||
    !batchId
  ) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/sales/stock/${warehouseId}/${batchId}`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load batch stock.',
    );
  }

  const data =
    (await response.json()) as BatchStockResponse[];

  return data[0] ?? null;
}

// =====================================================
// GET NEGATIVE STOCK SETTING
// =====================================================

export async function getAllowNegativeStock(): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/settings/ALLOW_NEGATIVE_STOCK`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load negative stock setting.',
    );
  }

  const data = await response.json();

  return (
    String(data.value).toLowerCase() ===
    'true'
  );
}