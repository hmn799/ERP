"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ERPTransactionGrid from "@/components/erp/transaction/ERPTransactionGrid";
import TransactionRow from "@/components/erp/transaction/TransactionRow";

import {
  TransactionRowModel,
} from "@/components/erp/transaction/transaction.types";

import {
  getItemLookup,
  ItemLookup,
} from "@/features/purchase/services/purchase.service";

import {
  itemMatchesExactCode,
  itemMatchesQuery,
} from "@/lib/item-search";

interface Props {
  rows: TransactionRowModel[];

  addRow(): void;

  removeRow(index: number): void;

  updateField(
    index: number,
    field: keyof TransactionRowModel,
    value: string | number,
  ): void;

  updateRow(
    index: number,
    row: TransactionRowModel,
  ): void;
}

export default function PurchaseItemsGrid({
  rows,
  addRow,
  removeRow,
  updateField,
  updateRow,
}: Props) {
  const [items, setItems] = useState<ItemLookup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        setLoading(true);
        const data = await getItemLookup();

        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        console.error("Failed to load purchase items:", error);

        if (!cancelled) {
          setSearchError("Failed to load items.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!search.trim()) {
      return [];
    }

    return items
      .filter((item) => itemMatchesQuery(item, search))
      .slice(0, 12);
  }, [items, search]);

  function createPurchaseRow(item: ItemLookup): TransactionRowModel {
    return {
      id: crypto.randomUUID(),

      barcode: item.barcode ?? "",

      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,

      batchId: "",
      batchNo: "",

      qty: 1,
      freeQty: 0,

      purchaseRate: Number(item.purchaseRate ?? 0),
      retailRate: Number(item.retailRate ?? 0),
      wholesaleRate: Number(item.wholesaleRate ?? 0),
      distributorRate: Number(item.distributorRate ?? 0),

      mrp: Number(item.mrp ?? 0),

      gstPercent: Number(item.gstPercent ?? 0),
      discountPercent: 0,

      taxableAmount: 0,

      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,

      netAmount: 0,
    };
  }

  /*
   * Focuses the Batch field of the row at `index` so the cursor
   * flow (Barcode -> Batch -> Qty -> ...) continues into the row
   * that was just filled by the search bar, instead of leaving
   * focus stuck on the search bar itself. Waits a frame because
   * the row's own state update (and, for a brand-new row, its DOM
   * node) hasn't committed yet.
   */
  function focusRowBatch(index: number) {
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `input[data-row-index="${index}"][data-field="batch"]`,
      ) as HTMLInputElement | null;

      if (el) {
        el.focus();
        el.select();
      } else {
        searchRef.current?.focus();
      }
    });
  }

  function addSelectedItem(item: ItemLookup) {
    setSearchError("");
    setSearch("");
    setShowResults(false);

    const existingIndex = rows.findIndex(
      (row) =>
        row.itemId === item.id &&
        row.batchNo.trim() === "",
    );

    if (existingIndex >= 0) {
      updateField(
        existingIndex,
        "qty",
        Number(rows[existingIndex].qty || 0) + 1,
      );

      focusRowBatch(existingIndex);

      return;
    }

    const emptyRowIndex = rows.findIndex(
      (row) => !row.itemId,
    );

    if (emptyRowIndex >= 0) {
      updateRow(
        emptyRowIndex,
        {
          ...rows[emptyRowIndex],
          ...createPurchaseRow(item),
        },
      );

      focusRowBatch(emptyRowIndex);

      return;
    }

    /*
     * No empty row exists - append one and populate it. Both
     * addRow() and updateRow() use React's functional setState
     * form internally, so queuing them back-to-back here applies
     * against the up-to-date state (not this stale `rows` closure)
     * and is safe to do synchronously, without an intermediate
     * requestAnimationFrame.
     */
    const nextIndex = rows.length;

    addRow();
    updateRow(nextIndex, createPurchaseRow(item));

    focusRowBatch(nextIndex);
  }

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();

      setSearch("");
      setShowResults(false);
      setSearchError("");

      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const query = search.trim().toLowerCase();

    if (!query) {
      return;
    }

    /*
     * Barcode (primary or alternate) and item code are preferred
     * as exact matches. This is important for barcode scanners
     * because the scanner normally sends the complete barcode
     * followed by Enter.
     */
    const exactMatch = items.find((item) =>
      itemMatchesExactCode(item, query),
    );

    if (exactMatch) {
      addSelectedItem(exactMatch);
      return;
    }

    if (results.length === 1) {
      addSelectedItem(results[0]);
      return;
    }

    if (results.length > 1) {
      setShowResults(true);
      setSearchError("Select the item from the search results.");
      return;
    }

    setSearchError("Item not found.");
    setShowResults(true);
  }

  function handleItemSelected(
    index: number,
    item: ItemLookup,
  ) {
    updateRow(index, {
      ...rows[index],

      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,

      barcode: item.barcode ?? "",

      purchaseRate: Number(item.purchaseRate ?? 0),
      retailRate: Number(item.retailRate ?? 0),
      wholesaleRate: Number(item.wholesaleRate ?? 0),
      distributorRate: Number(item.distributorRate ?? 0),

      mrp: Number(item.mrp ?? 0),

      gstPercent: Number(item.gstPercent ?? 0),
    });
  }

  /*
   * Lets a row's own Barcode cell resolve an item directly (matches
   * primary or alternate barcodes, or an item code) - completing
   * Barcode -> Batch -> Qty -> ... entirely within the row, instead
   * of requiring the separate search bar above the grid.
   */
  function resolveItemByCode(code: string) {
    return items.find((item) =>
      itemMatchesExactCode(item, code),
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Items
            </h2>

            <p className="text-xs text-gray-500">
              Scan barcode or search item
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Item
          </button>
        </div>

        <div className="relative mt-4">
          <input
            ref={searchRef}
            type="text"
            value={search}
            autoComplete="off"
            placeholder="Scan barcode / type item code / item name..."
            className="w-full rounded-md border-2 px-4 py-3 outline-none focus:border-black"
            aria-label="Scan barcode or search item"
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchError("");
              setShowResults(true);
            }}
            onFocus={() => {
              if (search.trim()) {
                setShowResults(true);
              }
            }}
            onKeyDown={handleSearchKeyDown}
          />

          {showResults && search.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-white shadow-lg">
              {loading && (
                <div className="p-3 text-sm text-gray-500">
                  Loading items...
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="p-3 text-sm text-gray-500">
                  {searchError || "No items found."}
                </div>
              )}

              {!loading &&
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full border-b px-4 py-3 text-left hover:bg-gray-50"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => addSelectedItem(item)}
                  >
                    <div className="font-semibold">
                      {item.itemCode} - {item.name}
                    </div>

                    <div className="mt-0.5 text-xs text-gray-500">
                      Barcode: {item.barcode || "-"} · P.Rate: ₹
                      {Number(item.purchaseRate ?? 0).toFixed(2)} · GST{" "}
                      {Number(item.gstPercent ?? 0)}%
                    </div>
                  </button>
                ))}
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500">
            Scan/type item → Enter → item is added to the purchase.
          </p>

          {searchError && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {searchError}
            </p>
          )}
        </div>
      </div>

      <ERPTransactionGrid
        title=""
        data={rows}
      >
        <thead className="sticky top-0 z-10 border-b bg-white">
          <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            <th className="w-28 px-3 py-3 text-left">
              Barcode
            </th>

            <th className="min-w-[260px] px-3 py-3 text-left">
              Item
            </th>

            <th className="w-32 px-3 py-3 text-left">
              Batch
            </th>

            <th className="w-20 px-3 py-3 text-right">
              Qty
            </th>

            <th className="w-20 px-3 py-3 text-right">
              Free
            </th>

            <th className="w-24 px-3 py-3 text-right">
              P.Rate
            </th>

            <th className="w-24 px-3 py-3 text-right">
              Retail
            </th>

            <th className="w-24 px-3 py-3 text-right">
              Wholesale
            </th>

            <th className="w-28 px-3 py-3 text-right">
              Distributor
            </th>

            <th className="w-20 px-3 py-3 text-right">
              MRP
            </th>

            <th className="w-16 px-3 py-3 text-center">
              GST
            </th>

            <th className="w-28 px-3 py-3 text-right">
              Net
            </th>

            <th className="w-20 px-3 py-3 text-center">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <TransactionRow
              key={row.id}
              row={row}
              index={index}
              mode="purchase"
              onChange={updateField}
              onItemSelected={handleItemSelected}
              onResolveBarcode={resolveItemByCode}
              onBarcodeNotFound={() =>
                setSearchError(
                  "No item matches that barcode.",
                )
              }
              onDelete={removeRow}
            />
          ))}
        </tbody>
      </ERPTransactionGrid>
    </section>
  );
}
