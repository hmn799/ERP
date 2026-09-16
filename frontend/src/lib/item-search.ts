interface SearchableItem {
  itemCode: string;
  name: string;
  barcode: string | null;
  alternateBarcodes?: string[];
}

function allBarcodes(item: SearchableItem): string[] {
  return [item.barcode, ...(item.alternateBarcodes ?? [])].filter(
    (code): code is string => !!code,
  );
}

/*
 * Substring match against item code, name, and every known barcode
 * (primary + alternates) - used for the live search dropdown.
 */
export function itemMatchesQuery(
  item: SearchableItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  if (item.itemCode.toLowerCase().includes(q)) return true;
  if (item.name.toLowerCase().includes(q)) return true;

  return allBarcodes(item).some((code) =>
    code.toLowerCase().includes(q),
  );
}

/*
 * Exact match against item code or any known barcode - used when a
 * barcode scanner sends a full code followed by Enter, where a
 * substring match would be too loose.
 */
export function itemMatchesExactCode(
  item: SearchableItem,
  code: string,
): boolean {
  const value = code.trim().toLowerCase();
  if (!value) return false;

  if (item.itemCode.trim().toLowerCase() === value) return true;

  return allBarcodes(item).some(
    (barcode) => barcode.trim().toLowerCase() === value,
  );
}
