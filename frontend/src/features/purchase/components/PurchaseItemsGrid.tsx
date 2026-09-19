"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import ERPTransactionGrid from "@/components/erp/transaction/ERPTransactionGrid";
import TransactionRow from "@/components/erp/transaction/TransactionRow";

import {
  TransactionRowModel,
} from "@/components/erp/transaction/transaction.types";

import {
  BatchLookup,
  getItemLookup,
  ItemLookup,
} from "@/features/purchase/services/purchase.service";

import {
  itemMatchesQuery,
  itemsMatchingExactCode,
} from "@/lib/item-search";

interface Props {
  rows: TransactionRowModel[];

  taxMode: "EXCLUSIVE" | "INCLUSIVE";

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
  taxMode,
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
   * Focuses a named field of the row at `index` (the cursor flow
   * only ever targets "barcode" or "batch") so the grid can hand
   * focus off between rows on its own - after the search bar fills
   * a row, or after an operator finishes the last field of a row -
   * instead of leaving focus stuck wherever it was, or forcing a
   * click back up to the search bar.
   *
   * Called synchronously, right after any state update that the
   * target row's DOM node depends on has already been flushed (see
   * flushSync below) - never wrapped in its own setTimeout/rAF. A
   * deferred focus() races against fast/scanner-speed typing: if
   * the operator's next keystroke arrives before the callback runs,
   * it lands wherever focus still is instead of the field it was
   * meant for.
   */
  function focusRowField(
    index: number,
    field: "barcode" | "batch",
  ) {
    const el = document.querySelector(
      `input[data-row-index="${index}"][data-field="${field}"]`,
    ) as HTMLInputElement | null;

    if (el) {
      el.focus();
      el.select();
    } else {
      searchRef.current?.focus();
    }
  }

  /*
   * Enter on a row's last field (MRP) continues the flow onto the
   * next row's own Barcode cell - creating that row first if this
   * was the last one - so an operator can keep scanning/entering
   * items back-to-back without leaving the grid. flushSync forces
   * the new row to actually commit to the DOM before focusRowField
   * looks for it, instead of hoping a requestAnimationFrame wins
   * the race against React's own render.
   */
  function handleRowComplete(index: number) {
    if (index + 1 < rows.length) {
      focusRowField(index + 1, "barcode");
      return;
    }

    flushSync(() => {
      addRow();
    });

    focusRowField(index + 1, "barcode");
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
      flushSync(() => {
        updateField(
          existingIndex,
          "qty",
          Number(rows[existingIndex].qty || 0) + 1,
        );
      });

      focusRowField(existingIndex, "batch");

      return;
    }

    const emptyRowIndex = rows.findIndex(
      (row) => !row.itemId,
    );

    if (emptyRowIndex >= 0) {
      flushSync(() => {
        updateRow(
          emptyRowIndex,
          {
            ...rows[emptyRowIndex],
            ...createPurchaseRow(item),
          },
        );
      });

      focusRowField(emptyRowIndex, "batch");

      return;
    }

    /*
     * No empty row exists - append one and populate it in a single
     * flush. Both addRow() and updateRow() use React's functional
     * setState form internally, so queuing them back-to-back inside
     * flushSync applies against up-to-date state (not this stale
     * `rows` closure) and commits to the DOM before we try to focus
     * the new row's Batch field.
     */
    const nextIndex = rows.length;

    flushSync(() => {
      addRow();
      updateRow(nextIndex, createPurchaseRow(item));
    });

    focusRowField(nextIndex, "batch");
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
     *
     * More than one item can share the same barcode (a mislabeled
     * product, a reused generic code) - in that case fall through to
     * the results dropdown instead of silently picking whichever
     * item happens to come first, so the operator chooses.
     */
    const exactMatches = itemsMatchingExactCode(items, query);

    if (exactMatches.length === 1) {
      addSelectedItem(exactMatches[0]);
      return;
    }

    if (exactMatches.length > 1) {
      setShowResults(true);
      setSearchError(
        "Multiple items share this barcode - select one below.",
      );
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
   * Picking an existing batch from the Batch cell's own lookup
   * should mean actually reusing it - so its rates/MRP replace
   * whatever the item master currently holds, matching what the
   * InventoryDecisionEngine treats as the same batch (rate + MRP +
   * expiry) on save. If the bill is in Inclusive mode, the batch's
   * stored rate (always tax-exclusive) is converted back to the
   * inclusive figure the operator expects to see, the same reverse
   * conversion used when reopening an existing bill for edit.
   */
  function handleBatchSelected(
    index: number,
    batch: BatchLookup,
  ) {
    const row = rows[index];

    const gstPercent = Number(
      row.gstPercent || 0,
    );

    const storedRate = Number(
      batch.purchaseRate ?? 0,
    );

    const displayRate =
      taxMode === "INCLUSIVE" &&
      gstPercent > 0
        ? storedRate *
          (1 + gstPercent / 100)
        : storedRate;

    updateRow(index, {
      ...row,

      batchId: batch.id,
      batchNo: batch.batchNo,

      purchaseRate: displayRate,
      retailRate: Number(
        batch.retailRate ?? 0,
      ),
      wholesaleRate: Number(
        batch.wholesaleRate ?? 0,
      ),
      distributorRate: Number(
        batch.distributorRate ?? 0,
      ),

      mrp: Number(batch.mrp ?? 0),
    });
  }

  /*
   * Lets a row's own Barcode cell resolve an item directly (matches
   * primary or alternate barcodes, or an item code) - completing
   * Barcode -> Batch -> Qty -> ... entirely within the row, instead
   * of requiring the separate search bar above the grid. Returns
   * every match, not just one, so the caller can tell an ambiguous
   * code (shared by more than one item) from a clean single hit.
   */
  function resolveItemByCode(code: string) {
    return itemsMatchingExactCode(items, code);
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
              onBarcodeAmbiguous={(code) => {
                setSearch(code);
                setShowResults(true);
                setSearchError(
                  "Multiple items share this barcode - select one below.",
                );
                requestAnimationFrame(() =>
                  searchRef.current?.focus(),
                );
              }}
              onBatchSelected={handleBatchSelected}
              onRowComplete={handleRowComplete}
              onDelete={removeRow}
            />
          ))}
        </tbody>
      </ERPTransactionGrid>
    </section>
  );
}
