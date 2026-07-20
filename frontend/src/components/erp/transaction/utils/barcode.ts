export interface BarcodeResult {
  found: boolean;

  batchId?: string;

  batchNo?: string;

  itemId?: string;

  itemName?: string;
}

export async function findBarcode(
  barcode: string,
): Promise<BarcodeResult> {
  return {
    found: false,
  };
}