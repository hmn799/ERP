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

/*
 * Every item matching a scanned code exactly, not just the first one.
 * The same barcode can legitimately end up on more than one item (a
 * mislabeled product, a shared generic code), so callers must be able
 * to tell "one match" from "several" and let the operator pick rather
 * than silently acting on whichever item happens to come first.
 */
export function itemsMatchingExactCode<T extends SearchableItem>(
  items: T[],
  code: string,
): T[] {
  return items.filter((item) => itemMatchesExactCode(item, code));
}
