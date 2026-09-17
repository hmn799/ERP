"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  SalesBatchLookup,
  SalesItemLookup,
} from "../types/sales.types";

import {
  getAllowNegativeStock,
  getWarehouseStocks,
} from "../services/sales-stock.service";

import { itemMatchesExactCode } from "@/lib/item-search";

import {
  calculateSalesRowAmounts,
  SalesTaxMode,
} from "@/core/pricing/sales.calculator";

export interface SalesGridRow {
  itemId: string;
  batchId: string;
  qty: number;
  saleRate: number;
  discountPercent: number;
  gstPercent: number;
}

interface SalesItemsGridProps {
  rows: SalesGridRow[];

  /*
   * Original rows from the saved bill.
   *
   * IMPORTANT:
   * This must NOT change while the user edits the bill.
   *
   * It allows us to temporarily add the original
   * sold quantity back to available stock.
   */
  originalRows: SalesGridRow[];

  items: SalesItemLookup[];
  batches: SalesBatchLookup[];

  warehouseId: string;

  taxMode: SalesTaxMode;

  onAddRow: () => void;
  onRemoveRow: (index: number) => void;

  onItemChange: (
    index: number,
    itemId: string,
  ) => void;

  onBatchChange: (
    index: number,
    batchId: string,
  ) => void;

  onQtyChange: (
    index: number,
    qty: number,
  ) => void;

  onRateChange: (
    index: number,
    rate: number,
  ) => void;

  onQuickAddItem: (
    itemId: string,
  ) => void;

  onQuickSetQty: (
    qty: number,
  ) => void;
}

function getNumber(
  value: number | string | undefined,
) {
  return Number(value ?? 0);
}

function getItemSearchText(
  item: SalesItemLookup,
) {
  return [
    item.itemCode,
    item.name,
    item.barcode ?? "",
    ...(item.alternateBarcodes ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export default function SalesItemsGrid({
  rows,
  originalRows,
  items,
  batches,
  warehouseId,
  taxMode,
  onAddRow,
  onRemoveRow,
  onItemChange,
  onBatchChange,
  onQtyChange,
  onRateChange,
  onQuickAddItem,
  onQuickSetQty,
}: SalesItemsGridProps) {
  const searchRef =
    useRef<HTMLInputElement>(null);

  const popupRef =
    useRef<HTMLDivElement>(null);

  const [search, setSearch] =
    useState("");

  const [batchStocks, setBatchStocks] =
    useState<Record<string, number>>({});

  const [
    allowNegativeStock,
    setAllowNegativeStock,
  ] = useState(false);

  const [
    loadingStocks,
    setLoadingStocks,
  ] = useState(false);

  const [
    stockError,
    setStockError,
  ] = useState<string | null>(null);

  /*
   * =====================================================
   * BATCH POPUP
   * =====================================================
   */

  const [
    batchPopupRowIndex,
    setBatchPopupRowIndex,
  ] = useState<number | null>(null);

  const [
    batchPopupOptions,
    setBatchPopupOptions,
  ] = useState<SalesBatchLookup[]>([]);

  const [
    selectedBatchPopupIndex,
    setSelectedBatchPopupIndex,
  ] = useState(0);

  const dismissedPopupKeyRef =
    useRef<string | null>(null);

  /*
   * =====================================================
   * LOAD NEGATIVE STOCK SETTING
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadSetting() {
      try {
        const allowed =
          await getAllowNegativeStock();

        if (!cancelled) {
          setAllowNegativeStock(
            allowed,
          );
        }
      } catch (error) {
        console.error(
          "Failed to load negative stock setting:",
          error,
        );

        if (!cancelled) {
          setAllowNegativeStock(false);
        }
      }
    }

    loadSetting();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =====================================================
   * LOAD WAREHOUSE STOCK
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadStocks() {
      if (!warehouseId) {
        setBatchStocks({});
        return;
      }

      try {
        setLoadingStocks(true);
        setStockError(null);

        const stocks =
          await getWarehouseStocks(
            warehouseId,
          );

        if (cancelled) {
          return;
        }

        const stockMap: Record<
          string,
          number
        > = {};

        for (const stock of stocks) {
          stockMap[stock.batchId] =
            Number(
              stock.quantity,
            );
        }

        setBatchStocks(stockMap);
      } catch (error) {
        console.error(
          "Failed to load warehouse stock:",
          error,
        );

        if (!cancelled) {
          setBatchStocks({});
          setStockError(
            "Unable to load warehouse stock.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingStocks(false);
        }
      }
    }

    loadStocks();

    return () => {
      cancelled = true;
    };
  }, [warehouseId]);

  /*
   * =====================================================
   * SEARCH RESULTS
   * =====================================================
   */

  const searchResults =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return [];
      }

      return items
        .filter((item) =>
          getItemSearchText(
            item,
          ).includes(term),
        )
        .slice(0, 10);
    }, [
      items,
      search,
    ]);

  /*
   * =====================================================
   * FOCUS SEARCH
   * =====================================================
   */

  function focusSearch() {
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  }

  /*
   * =====================================================
   * BATCH HELPERS
   * =====================================================
   */

  function getActiveBatchesForRow(
    rowIndex: number,
  ) {
    const row =
      rows[rowIndex];

    if (!row?.itemId) {
      return [];
    }

    return batches.filter(
      (batch) =>
        batch.itemId ===
          row.itemId &&
        batch.isActive !==
          false &&
        batch.status !==
          "INACTIVE",
    );
  }

  function closeBatchPopup() {
    setBatchPopupRowIndex(
      null,
    );

    setBatchPopupOptions([]);

    setSelectedBatchPopupIndex(
      0,
    );
  }

  function selectBatchFromPopup(
    batch: SalesBatchLookup,
  ) {
    if (
      batchPopupRowIndex ===
      null
    ) {
      return;
    }

    onBatchChange(
      batchPopupRowIndex,
      batch.id,
    );

    dismissedPopupKeyRef.current =
      null;

    closeBatchPopup();

    focusSearch();
  }

  /*
   * =====================================================
   * AUTOMATIC BATCH POPUP
   * =====================================================
   *
   * If:
   *
   * item selected
   * +
   * no batch selected
   * +
   * multiple active batches
   *
   * open the batch selector.
   *
   * If exactly one batch exists,
   * the SalesPage logic may already select it.
   */

  useEffect(() => {
    if (
      batchPopupRowIndex !==
      null
    ) {
      return;
    }

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row =
        rows[index];

      if (
        !row.itemId ||
        row.batchId
      ) {
        continue;
      }

      const activeBatches =
        getActiveBatchesForRow(
          index,
        );

      if (
        activeBatches.length <=
        1
      ) {
        continue;
      }

      const popupKey =
        `${index}:${row.itemId}`;

      if (
        dismissedPopupKeyRef.current ===
        popupKey
      ) {
        continue;
      }

      setBatchPopupRowIndex(
        index,
      );

      setBatchPopupOptions(
        activeBatches,
      );

      setSelectedBatchPopupIndex(
        0,
      );

      return;
    }
  }, [
    rows,
    batches,
    batchPopupRowIndex,
  ]);

  /*
   * =====================================================
   * BATCH POPUP KEYBOARD
   * =====================================================
   */

  useEffect(() => {
    if (
      batchPopupRowIndex ===
        null ||
      batchPopupOptions.length ===
        0
    ) {
      return;
    }

    function handlePopupKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "ArrowDown"
      ) {
        event.preventDefault();

        setSelectedBatchPopupIndex(
          (current) =>
            Math.min(
              current + 1,
              batchPopupOptions.length -
                1,
            ),
        );

        return;
      }

      if (
        event.key ===
        "ArrowUp"
      ) {
        event.preventDefault();

        setSelectedBatchPopupIndex(
          (current) =>
            Math.max(
              current - 1,
              0,
            ),
        );

        return;
      }

      if (
        event.key ===
        "Enter"
      ) {
        event.preventDefault();

        const batch =
          batchPopupOptions[
            selectedBatchPopupIndex
          ];

        if (batch) {
          selectBatchFromPopup(
            batch,
          );
        }

        return;
      }

      if (
        event.key ===
        "Escape"
      ) {
        event.preventDefault();

        const rowIndex =
  batchPopupRowIndex;

if (rowIndex !== null) {
  const row =
    rows[rowIndex];

  if (row) {
    dismissedPopupKeyRef.current =
      `${rowIndex}:${row.itemId}`;
  }
}

        closeBatchPopup();

        focusSearch();
      }
    }

    window.addEventListener(
      "keydown",
      handlePopupKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handlePopupKeyDown,
      );
    };
  }, [
    batchPopupRowIndex,
    batchPopupOptions,
    selectedBatchPopupIndex,
    rows,
  ]);

  /*
   * =====================================================
   * SEARCH KEYBOARD
   * =====================================================
   */

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      if (
        searchResults.length ===
        1
      ) {
        onQuickAddItem(
          searchResults[0].id,
        );

        setSearch("");

        return;
      }

      const exactMatch =
        items.find((item) =>
          itemMatchesExactCode(
            item,
            search,
          ),
        );

      if (exactMatch) {
        onQuickAddItem(
          exactMatch.id,
        );

        setSearch("");

        return;
      }

      if (
        searchResults.length >
        0
      ) {
        onQuickAddItem(
          searchResults[0].id,
        );

        setSearch("");

        return;
      }
    }
  }

  /*
   * =====================================================
   * QUICK QUANTITY KEYBOARD
   * =====================================================
   *
   * Example:
   *
   * type +10
   * Enter
   *
   * quantity of the most recently added item becomes 10.
   *
   * The leading "+" is required, not optional - most barcodes
   * are themselves plain digit strings (e.g. "1003"), so without
   * it every numeric barcode scan would be swallowed as a
   * quantity command instead of adding the item.
   */

  function handleSearchInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();

      const value =
        search.trim();

      if (
        /^\+\d+(\.\d+)?$/.test(
          value,
        )
      ) {
        const qty =
          Number(value);

        if (
          Number.isFinite(qty) &&
          qty > 0
        ) {
          onQuickSetQty(
            qty,
          );

          setSearch("");

          return;
        }
      }

      handleSearchKeyDown(
        event,
      );
    }
  }

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="rounded-lg border bg-white">

      {/* =================================================
          AUTOMATIC BATCH POPUP
          ================================================= */}

      {batchPopupRowIndex !==
        null &&
        batchPopupOptions.length >
          1 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

            <div
              ref={popupRef}
              className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
            >

              <div className="border-b px-5 py-4">
                <h3 className="text-lg font-bold">
                  Select Batch
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Multiple batches are available for this item.
                </p>
              </div>

              <div className="p-3">

                {batchPopupOptions.map(
                  (
                    batch,
                    index,
                  ) => {
                    const stock =
                      Number(
                        batchStocks[
                          batch.id
                        ] ??
                          0,
                      );

                    const isSelected =
                      index ===
                      selectedBatchPopupIndex;

                    return (
                      <button
                        key={
                          batch.id
                        }
                        type="button"
                        onClick={() =>
                          selectBatchFromPopup(
                            batch,
                          )
                        }
                        className={`mb-2 flex w-full items-center justify-between rounded-lg border p-4 text-left ${
                          isSelected
                            ? "border-black bg-gray-100"
                            : "hover:bg-gray-50"
                        }`}
                      >

                        <div>
                          <div className="font-semibold">
                            {
                              batch.batchNo
                            }
                          </div>

                          <div className="text-xs text-gray-500">
                            Purchase ₹
                            {getNumber(
                              batch.purchaseRate,
                            ).toFixed(
                              2,
                            )}
                            {" · "}
                            Retail ₹
                            {getNumber(
                              batch.retailRate,
                            ).toFixed(
                              2,
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            Stock
                          </div>

                          <div className="font-bold">
                            {stock}
                          </div>
                        </div>

                      </button>
                    );
                  },
                )}

              </div>

              <div className="border-t bg-gray-50 px-5 py-3 text-xs text-gray-500">
                ↑ ↓ Select · Enter Confirm · ESC Close
              </div>

            </div>

          </div>
        )}

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex items-center justify-between border-b p-4">

        <div>
          <h2 className="font-semibold">
            Items
          </h2>

          <p className="text-xs text-gray-500">
            Scan barcode or search item
          </p>
        </div>

        <button
          type="button"
          onClick={
            onAddRow
          }
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Item
        </button>

      </div>

      {/* =================================================
          SEARCH
          ================================================= */}

      <div className="border-b p-4">

        <input
          ref={searchRef}
          type="text"
          value={search}
          aria-label="Scan barcode or search item"
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          onKeyDown={
            handleSearchInputKeyDown
          }
          placeholder="Scan barcode / type item code / item name..."
          className="w-full rounded-md border-2 px-4 py-3 outline-none focus:border-black"
        />

        <p className="mt-1 text-xs text-gray-500">
          Set Mode: Scan/type item → Enter → type +10 → Enter to set quantity to 10.
        </p>

        {!allowNegativeStock && (
          <p className="mt-2 text-xs text-blue-700">
            Negative stock is disabled. Sales cannot exceed available stock.
          </p>
        )}

        {stockError && (
          <p className="mt-2 text-xs text-red-600">
            {stockError}
          </p>
        )}

        {searchResults.length >
          0 && (
          <div className="mt-2 overflow-hidden rounded-md border bg-white shadow">

            {searchResults.map(
              (item) => (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() => {
                    onQuickAddItem(
                      item.id,
                    );

                    setSearch(
                      "",
                    );

                    focusSearch();
                  }}
                  className="block w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                >
                  <div className="font-medium">
                    {
                      item.itemCode
                    }{" "}
                    -{" "}
                    {
                      item.name
                    }
                  </div>

                  <div className="text-xs text-gray-500">
                    Barcode:{" "}
                    {
                      item.barcode ??
                      "-"
                    }
                  </div>
                </button>
              ),
            )}

          </div>
        )}

      </div>

      {/* =================================================
          TABLE
          ================================================= */}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1000px] text-sm">

          <thead className="border-b bg-gray-50">

            <tr>

              <th className="px-3 py-3 text-left">
                #
              </th>

              <th className="px-3 py-3 text-left">
                Item
              </th>

              <th className="px-3 py-3 text-left">
                Batch
              </th>

              <th className="px-3 py-3 text-right">
                Qty
              </th>

              <th className="px-3 py-3 text-right">
                Rate
              </th>

              <th className="px-3 py-3 text-right">
                GST %
              </th>

              <th className="px-3 py-3 text-right">
                Amount
              </th>

              <th className="px-3 py-3 text-center">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {rows.length ===
            0 ? (
              <tr>
                <td
                  colSpan={
                    8
                  }
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No items added.
                </td>
              </tr>
            ) : (
              rows.map(
                (
                  row,
                  index,
                ) => {

                  const item =
                    items.find(
                      (
                        entry,
                      ) =>
                        entry.id ===
                        row.itemId,
                    );

                  const itemBatches =
                    batches.filter(
                      (
                        batch,
                      ) =>
                        batch.itemId ===
                          row.itemId &&
                        batch.isActive !==
                          false &&
                        batch.status !==
                          "INACTIVE",
                    );

                  /*
                   * =================================================
                   * EDIT STOCK LOGIC
                   * =================================================
                   *
                   * Physical stock is the quantity currently
                   * available in the warehouse.
                   *
                   * When editing a bill, the quantity that this
                   * same bill originally consumed from the same
                   * batch must be added back temporarily.
                   *
                   * Example:
                   *
                   * Physical stock = 2
                   * Original bill qty = 3
                   * Effective available = 5
                   *
                   * Therefore:
                   *
                   * Qty 3 → OK
                   * Qty 4 → OK
                   * Qty 5 → OK
                   * Qty 6 → insufficient
                   *
                   * If the row switches to another batch,
                   * original quantity is NOT added to the
                   * other batch.
                   */

                  const physicalStock =
                    row.batchId
                      ? Number(
                          batchStocks[
                            row.batchId
                          ] ??
                            0,
                        )
                      : 0;

                  const originalQtyForBatch =
                    row.batchId
                      ? originalRows
                          .filter(
                            (
                              originalRow,
                            ) =>
                              originalRow.itemId ===
                                row.itemId &&
                              originalRow.batchId ===
                                row.batchId,
                          )
                          .reduce(
                            (
                              total,
                              originalRow,
                            ) =>
                              total +
                              Number(
                                originalRow.qty ??
                                  0,
                              ),
                            0,
                          )
                      : 0;

                  const effectiveAvailableStock =
                    physicalStock +
                    originalQtyForBatch;

                  const selectedStock =
                    row.batchId
                      ? effectiveAvailableStock
                      : null;

                  const stockExceeded =
                    !allowNegativeStock &&
                    row.batchId !==
                      "" &&
                    Number(
                      row.qty,
                    ) >
                      effectiveAvailableStock;

                  const rowAmounts =
                    calculateSalesRowAmounts(
                      row,
                      taxMode,
                    );

                  const net =
                    rowAmounts.netAmount;

                  return (
                    <tr
                      key={
                        `${row.itemId}-${row.batchId}-${index}`
                      }
                      className="border-b last:border-b-0"
                    >

                      {/* NUMBER */}

                      <td className="px-3 py-3 align-top">
                        {index +
                          1}
                      </td>

                      {/* ITEM */}

                      <td className="p-2 align-top">

                        <select
                          value={
                            row.itemId
                          }
                          onChange={(
                            event,
                          ) =>
                            onItemChange(
                              index,
                              event
                                .target
                                .value,
                            )
                          }
                          className="w-full rounded border px-2 py-2"
                        >

                          <option value="">
                            Select Item
                          </option>

                          {items.map(
                            (
                              entry,
                            ) => (
                              <option
                                key={
                                  entry.id
                                }
                                value={
                                  entry.id
                                }
                              >
                                {
                                  entry.itemCode
                                }{" "}
                                -{" "}
                                {
                                  entry.name
                                }
                              </option>
                            ),
                          )}

                        </select>

                        {item?.barcode && (
                          <div className="mt-1 text-xs text-gray-500">
                            {
                              item.barcode
                            }
                          </div>
                        )}

                      </td>

                      {/* BATCH */}

                      <td className="p-2 align-top">

                        <select
                          value={
                            row.batchId
                          }
                          onChange={(
                            event,
                          ) =>
                            onBatchChange(
                              index,
                              event
                                .target
                                .value,
                            )
                          }
                          disabled={
                            !row.itemId
                          }
                          className="w-full rounded border px-2 py-2"
                        >

                          <option value="">
                            Select Batch
                          </option>

                          {itemBatches.map(
                            (
                              batch,
                            ) => {

                              /*
                               * For the dropdown itself,
                               * show physical stock.
                               *
                               * The selected batch's
                               * effective stock is shown
                               * underneath the selector.
                               */

                              const stock =
                                Number(
                                  batchStocks[
                                    batch.id
                                  ] ??
                                    0,
                                );

                              const originalBatchQty =
                                originalRows
                                  .filter(
                                    (
                                      originalRow,
                                    ) =>
                                      originalRow.itemId ===
                                        row.itemId &&
                                      originalRow.batchId ===
                                        batch.id,
                                  )
                                  .reduce(
                                    (
                                      total,
                                      originalRow,
                                    ) =>
                                      total +
                                      Number(
                                        originalRow.qty ??
                                          0,
                                      ),
                                    0,
                                  );

                              const dropdownAvailable =
                                stock +
                                originalBatchQty;

                              return (
                                <option
                                  key={
                                    batch.id
                                  }
                                  value={
                                    batch.id
                                  }
                                >
                                  {
                                    batch.batchNo
                                  }{" "}
                                  — Stock:{" "}
                                  {
                                    dropdownAvailable
                                  }
                                </option>
                              );
                            },
                          )}

                        </select>

                        {row.batchId && (
                          <div
                            className={`mt-1 text-xs ${
                              stockExceeded
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            Available:{" "}
                            <span className="font-medium">
                              {
                                selectedStock
                              }
                            </span>

                            {originalQtyForBatch >
                              0 && (
                              <span className="ml-1 text-blue-600">
                                (includes current bill qty)
                              </span>
                            )}
                          </div>
                        )}

                        {stockExceeded && (
                          <div className="mt-1 text-xs font-medium text-red-600">
                            Insufficient stock.
                          </div>
                        )}

                      </td>

                      {/* QTY */}

                      <td className="p-2 text-right align-top">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row.qty
                          }
                          onChange={(
                            event,
                          ) =>
                            onQtyChange(
                              index,
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                            )
                          }
                          className={`w-24 rounded border px-2 py-2 text-right font-semibold ${
                            stockExceeded
                              ? "border-red-500 bg-red-50"
                              : ""
                          }`}
                        />

                      </td>

                      {/* RATE */}

                      <td className="p-2 text-right align-top">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row.saleRate
                          }
                          onChange={(
                            event,
                          ) =>
                            onRateChange(
                              index,
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                            )
                          }
                          className="w-28 rounded border px-2 py-2 text-right"
                        />

                      </td>

                      {/* GST */}

                      <td className="px-3 py-3 text-right align-top">
                        {getNumber(
                          row.gstPercent,
                        ).toFixed(
                          2,
                        )}
                        %
                      </td>

                      {/* AMOUNT */}

                      <td className="px-3 py-3 text-right font-medium align-top">
                        ₹
                        {net.toFixed(
                          2,
                        )}
                      </td>

                      {/* ACTION */}

                      <td className="p-2 text-center align-top">

                        <button
                          type="button"
                          onClick={() =>
                            onRemoveRow(
                              index,
                            )
                          }
                          className="rounded border px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>

                      </td>

                    </tr>
                  );
                },
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}