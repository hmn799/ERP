"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  createSaleReturn,
  getSaleReturns,
  getSalesBillForReturn,
  SaleReturnResponse,
} from "../services/sale-return.service";

import {
  getBatches,
  getCustomers,
  getItemLookup,
  getWarehouses,
} from "@/features/sales/services/sales.service";

import {
  CustomerLookup,
  SalesBatchLookup,
  SalesItemLookup,
  SalesResponse,
  WarehouseLookup,
} from "@/features/sales/types/sales.types";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

/*
 * =====================================================
 * TYPES
 * =====================================================
 */

interface ReturnRow {
  itemId: string;
  batchId: string;

  itemName: string;
  itemCode: string;
  batchNo: string;

  saleRate: number;
  gstPercent: number;

  soldQty: number;
  returnedQty: number;
  returnableQty: number;

  returnQty: number;
}

type RefundMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "CREDIT";

interface RefundLine {
  paymentMode: RefundMode;
  amount: number;
}

/*
 * =====================================================
 * CONTENT
 * =====================================================
 */

function SaleReturnContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const billId =
    searchParams.get("billId");

  /*
   * A direct return - no previous sales bill on file. Everything
   * below reuses the same returnRows/totals/refund-stage machinery
   * as a bill-anchored return; only how rows get added and what the
   * final createSaleReturn() payload carries actually differs.
   */

  const isDirectMode = !billId;

  const [sale, setSale] =
    useState<SalesResponse | null>(null);

  const [previousReturns, setPreviousReturns] =
    useState<SaleReturnResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [returnRows, setReturnRows] =
    useState<ReturnRow[]>([]);

  /*
   * =====================================================
   * DIRECT RETURN - LOOKUPS + SELECTION
   * =====================================================
   */

  const [warehouses, setWarehouses] =
    useState<WarehouseLookup[]>([]);

  const [customers, setCustomers] =
    useState<CustomerLookup[]>([]);

  const [directItems, setDirectItems] =
    useState<SalesItemLookup[]>([]);

  const [directBatches, setDirectBatches] =
    useState<SalesBatchLookup[]>([]);

  const [directWarehouseId, setDirectWarehouseId] =
    useState("");

  const [directCustomerId, setDirectCustomerId] =
    useState("");

  const [directSearch, setDirectSearch] =
    useState("");

  const [directItemError, setDirectItemError] =
    useState<string | null>(null);

  /*
   * =====================================================
   * REFUND STAGE
   * =====================================================
   */

  const [refundStage, setRefundStage] =
    useState(false);

  const [refundLines, setRefundLines] =
    useState<RefundLine[]>([]);

  const [refundError, setRefundError] =
    useState<string | null>(null);

  /*
   * =====================================================
   * LOAD ORIGINAL SALE + PREVIOUS RETURNS
   * =====================================================
   */

  useEffect(() => {
    async function loadReturnData() {
      if (!billId) {
        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          salesBill,
          allReturns,
        ] = await Promise.all([
          getSalesBillForReturn(
            billId,
          ),

          getSaleReturns(),
        ]);

        setSale(salesBill);

        const billReturns =
          allReturns.filter(
            (saleReturn) =>
              saleReturn.salesBillId ===
              billId,
          );

        setPreviousReturns(
          billReturns,
        );

        /*
         * =================================================
         * RETURNED QUANTITY MAP
         * =================================================
         */

        const returnedQtyMap =
          new Map<string, number>();

        for (
          const saleReturn of billReturns
        ) {
          for (
            const returnItem of
              saleReturn.items ?? []
          ) {
            const key =
              `${returnItem.itemId}:${returnItem.batchId}`;

            const previous =
              returnedQtyMap.get(key) ??
              0;

            returnedQtyMap.set(
              key,
              previous +
                Number(
                  returnItem.qty ?? 0,
                ),
            );
          }
        }

        /*
         * =================================================
         * BUILD RETURN ROWS
         * =================================================
         */

        const rows: ReturnRow[] =
          (salesBill.items ?? []).map(
            (saleItem) => {
              const key =
                `${saleItem.itemId}:${saleItem.batchId}`;

              const soldQty =
                Number(
                  saleItem.qty ?? 0,
                );

              const returnedQty =
                returnedQtyMap.get(key) ??
                0;

              const returnableQty =
                Math.max(
                  0,
                  soldQty -
                    returnedQty,
                );

              return {
                itemId:
                  saleItem.itemId,

                batchId:
                  saleItem.batchId,

                itemName:
                  saleItem.item?.name ??
                  "-",

                itemCode:
                  saleItem.item
                    ?.itemCode ?? "",

                batchNo:
                  saleItem.batch
                    ?.batchNo ?? "-",

                saleRate:
                  Number(
                    saleItem.saleRate ??
                      0,
                  ),

                gstPercent:
                  Number(
                    saleItem.gstPercent ??
                      0,
                  ),

                soldQty,

                returnedQty,

                returnableQty,

                returnQty: 0,
              };
            },
          );

        setReturnRows(rows);
      } catch (err) {
        console.error(
          "Failed to load sales return data:",
          err,
        );

        setError(
          "Failed to load sales return data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadReturnData();
  }, [billId]);

  /*
   * =====================================================
   * DIRECT RETURN - LOAD LOOKUPS
   * =====================================================
   */

  useEffect(() => {
    if (!isDirectMode) {
      return;
    }

    async function loadLookups() {
      try {
        setLoading(true);
        setError(null);

        const [
          warehouseList,
          customerList,
          itemList,
          batchList,
        ] = await Promise.all([
          getWarehouses(),
          getCustomers(),
          getItemLookup(),
          getBatches(),
        ]);

        setWarehouses(warehouseList);
        setCustomers(customerList);
        setDirectItems(itemList);
        setDirectBatches(batchList);
      } catch (err) {
        console.error(
          "Failed to load direct return lookups:",
          err,
        );

        setError(
          "Failed to load items and warehouses.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadLookups();
  }, [isDirectMode]);

  /*
   * =====================================================
   * DIRECT RETURN - ADD / EDIT ROWS
   * =====================================================
   */

  function directSearchResults() {
    const term =
      directSearch.trim().toLowerCase();

    if (!term) {
      return [];
    }

    return directItems
      .filter((item) =>
        [
          item.itemCode,
          item.name,
          item.barcode ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 10);
  }

  function addDirectRow(
    itemId: string,
  ) {
    const item =
      directItems.find(
        (entry) =>
          entry.id === itemId,
      );

    if (!item) {
      return;
    }

    const eligibleBatches =
      directBatches.filter(
        (batch) =>
          batch.itemId === itemId,
      );

    const automaticBatch =
      eligibleBatches.length === 1
        ? eligibleBatches[0]
        : undefined;

    setReturnRows((current) => [
      ...current,
      {
        itemId,
        batchId:
          automaticBatch?.id ?? "",

        itemName: item.name,
        itemCode: item.itemCode,
        batchNo:
          automaticBatch?.batchNo ??
          "",

        saleRate: automaticBatch
          ? Number(
              automaticBatch.retailRate,
            )
          : Number(item.retailRate),

        gstPercent: Number(
          (
            item as SalesItemLookup & {
              gstPercent?:
                | number
                | string;
            }
          ).gstPercent ?? 0,
        ),

        soldQty: 0,
        returnedQty: 0,
        returnableQty:
          Number.POSITIVE_INFINITY,

        returnQty: 1,
      },
    ]);

    setDirectSearch("");
    setDirectItemError(null);
  }

  function removeDirectRow(
    index: number,
  ) {
    setReturnRows((current) =>
      current.filter(
        (_, i) => i !== index,
      ),
    );
  }

  function updateDirectBatch(
    index: number,
    batchId: string,
  ) {
    const batch =
      directBatches.find(
        (entry) =>
          entry.id === batchId,
      );

    setReturnRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              batchId,
              batchNo:
                batch?.batchNo ?? "",
              saleRate: batch
                ? Number(
                    batch.retailRate,
                  )
                : row.saleRate,
            }
          : row,
      ),
    );
  }

  function updateDirectRate(
    index: number,
    value: string,
  ) {
    const numericValue =
      Number(value);

    setReturnRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              saleRate:
                value === ""
                  ? 0
                  : Number.isFinite(
                        numericValue,
                      )
                    ? numericValue
                    : row.saleRate,
            }
          : row,
      ),
    );
  }

  function updateDirectGst(
    index: number,
    value: string,
  ) {
    const numericValue =
      Number(value);

    setReturnRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              gstPercent:
                value === ""
                  ? 0
                  : Number.isFinite(
                        numericValue,
                      )
                    ? numericValue
                    : row.gstPercent,
            }
          : row,
      ),
    );
  }

  /*
   * =====================================================
   * UPDATE RETURN QTY
   * =====================================================
   */

  function updateReturnQty(
    rowIndex: number,
    value: string,
  ) {
    const numericValue =
      Number(value);

    setReturnRows(
      (currentRows) =>
        currentRows.map(
          (row, index) => {
            if (
              index !== rowIndex
            ) {
              return row;
            }

            if (value === "") {
              return {
                ...row,
                returnQty: 0,
              };
            }

            if (
              !Number.isFinite(
                numericValue,
              )
            ) {
              return row;
            }

            const safeQty =
              Math.min(
                Math.max(
                  0,
                  numericValue,
                ),
                row.returnableQty,
              );

            return {
              ...row,
              returnQty: safeQty,
            };
          },
        ),
    );
  }

  /*
   * =====================================================
   * SELECT ALL
   * =====================================================
   */

  function selectAllReturnable() {
    setReturnRows(
      (currentRows) =>
        currentRows.map(
          (row) => ({
            ...row,
            returnQty:
              row.returnableQty,
          }),
        ),
    );
  }

  /*
   * =====================================================
   * CLEAR
   * =====================================================
   */

  function clearReturnQuantities() {
    setReturnRows(
      (currentRows) =>
        currentRows.map(
          (row) => ({
            ...row,
            returnQty: 0,
          }),
        ),
    );
  }

  /*
   * =====================================================
   * CALCULATIONS
   * =====================================================
   */

  const selectedRows =
    useMemo(
      () =>
        returnRows.filter(
          (row) =>
            row.returnQty > 0,
        ),
      [returnRows],
    );

  const totalReturnQty =
    useMemo(
      () =>
        selectedRows.reduce(
          (total, row) =>
            total +
            row.returnQty,
          0,
        ),
      [selectedRows],
    );

  const totalTaxable =
    useMemo(
      () =>
        selectedRows.reduce(
          (total, row) =>
            total +
            row.returnQty *
              row.saleRate,
          0,
        ),
      [selectedRows],
    );

  const totalGst =
    useMemo(
      () =>
        selectedRows.reduce(
          (total, row) => {
            const taxable =
              row.returnQty *
              row.saleRate;

            return (
              total +
              taxable *
                (row.gstPercent /
                  100)
            );
          },
          0,
        ),
      [selectedRows],
    );

  const totalReturnAmount =
    Number(
      (
        totalTaxable +
        totalGst
      ).toFixed(2),
    );

  const refundAllocated =
    Number(
      refundLines
        .reduce(
          (total, line) =>
            total +
            Number(
              line.amount || 0,
            ),
          0,
        )
        .toFixed(2),
    );

  const refundRemaining =
    Number(
      (
        totalReturnAmount -
        refundAllocated
      ).toFixed(2),
    );

  const refundExact =
    Math.abs(
      refundRemaining,
    ) <= 0.01;

  const allReturnableSelected =
    returnRows.length > 0 &&
    returnRows.every(
      (row) =>
        row.returnQty ===
        row.returnableQty,
    );

  /*
   * =====================================================
   * REFUND MODE
   * =====================================================
   */

  function addRefundMode(
    mode: RefundMode,
  ) {
    setRefundError(null);

    setRefundLines(
      (current) => {
        if (
          current.some(
            (line) =>
              line.paymentMode ===
              mode,
          )
        ) {
          return current;
        }

        return [
          ...current,
          {
            paymentMode: mode,
            amount: 0,
          },
        ];
      },
    );
  }

  /*
   * =====================================================
   * REMOVE REFUND MODE
   * =====================================================
   */

  function removeRefundMode(
    mode: RefundMode,
  ) {
    setRefundError(null);

    setRefundLines(
      (current) =>
        current.filter(
          (line) =>
            line.paymentMode !==
            mode,
        ),
    );
  }

  /*
   * =====================================================
   * UPDATE REFUND AMOUNT
   * =====================================================
   */

  function updateRefundAmount(
    mode: RefundMode,
    value: string,
  ) {
    setRefundError(null);

    const numericValue =
      Number(value);

    setRefundLines(
      (current) =>
        current.map(
          (line) => {
            if (
              line.paymentMode !==
              mode
            ) {
              return line;
            }

            if (
              value === ""
            ) {
              return {
                ...line,
                amount: 0,
              };
            }

            if (
              !Number.isFinite(
                numericValue,
              )
            ) {
              return line;
            }

            return {
              ...line,
              amount: Math.max(
                0,
                numericValue,
              ),
            };
          },
        ),
    );
  }

  /*
   * =====================================================
   * AUTO FILL SINGLE MODE
   * =====================================================
   */

  function useSingleRefundMode(
    mode: RefundMode,
  ) {
    setRefundError(null);

    setRefundLines([
      {
        paymentMode: mode,
        amount:
          totalReturnAmount,
      },
    ]);
  }

  /*
   * =====================================================
   * BACK TO ITEM SELECTION
   * =====================================================
   */

  function backToItems() {
    setRefundStage(false);
    setRefundError(null);
  }

  /*
   * =====================================================
   * CONTINUE TO REFUND
   * =====================================================
   */

  function continueToRefund() {
    if (
      selectedRows.length ===
      0
    ) {
      return;
    }

    if (isDirectMode) {
      if (!directWarehouseId) {
        setDirectItemError(
          "Select a warehouse before continuing.",
        );

        return;
      }

      if (
        selectedRows.some(
          (row) => !row.batchId,
        )
      ) {
        setDirectItemError(
          "Select a batch for every item before continuing.",
        );

        return;
      }
    }

    setDirectItemError(null);

    setRefundError(null);

    setRefundLines([]);

    setRefundStage(true);
  }

  /*
   * =====================================================
   * CONFIRM REFUND - PLACEHOLDER
   *
   * Backend connection will be added
   * after the UI is validated.
   * =====================================================
   */

 async function confirmRefund() {
  setRefundError(null);

  if (refundLines.length === 0) {
    setRefundError(
      "Select at least one refund mode.",
    );

    return;
  }

  if (!refundExact) {
    setRefundError(
      `Refund allocation must equal ${formatCurrency(
        totalReturnAmount,
      )}.`,
    );

    return;
  }

  if (!isDirectMode && !sale) {
    setRefundError(
      "Sales bill not found.",
    );

    return;
  }

  if (
    isDirectMode &&
    !directWarehouseId
  ) {
    setRefundError(
      "Select a warehouse before saving.",
    );

    return;
  }

  try {

    /*
     * =====================================================
     * BUILD SALE RETURN ITEMS
     * =====================================================
     */

    const items =
      selectedRows.map((row) => ({
        itemId: row.itemId,
        batchId: row.batchId,
        qty: row.returnQty,
        saleRate: row.saleRate,
        gstPercent: row.gstPercent,
      }));

    /*
     * =====================================================
     * BUILD REFUND PAYMENTS
     * =====================================================
     */

    const payments =
      refundLines
        .filter(
          (line) =>
            Number(line.amount) > 0,
        )
        .map((line) => ({
          paymentMode:
            line.paymentMode,
          amount:
            Number(
              line.amount,
            ),
        }));

    if (payments.length === 0) {
      setRefundError(
        "Enter at least one refund amount.",
      );

      return;
    }

    /*
     * =====================================================
     * CREATE RETURN
     * =====================================================
     */

    const result =
  await createSaleReturn({
    returnDate:
      new Date().toISOString(),

    salesBillId:
      isDirectMode
        ? undefined
        : sale!.id,

    customerId:
      isDirectMode
        ? directCustomerId ||
          undefined
        : (sale!.customerId ??
          undefined),

    warehouseId:
      isDirectMode
        ? directWarehouseId
        : sale!.warehouseId,

    items,

    payments,
  });

    /*
     * =====================================================
     * SUCCESS
     * =====================================================
     */

    router.push(
      `/sales/returns/view/${result.id}`,
    );
  } catch (err) {
    console.error(
      "Failed to create sale return:",
      err,
    );

    let message =
      "Failed to create sales return.";

    if (err instanceof Error) {
      try {
        const parsed =
          JSON.parse(err.message);

        if (
          parsed?.message
        ) {
          message =
            Array.isArray(
              parsed.message,
            )
              ? parsed.message.join(
                  ", ",
                )
              : parsed.message;
        }
      } catch {
        if (err.message) {
          message =
            err.message;
        }
      }
    }

    setRefundError(message);
  }
}

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="p-6">
        Loading sales return...
      </div>
    );
  }

  /*
   * =====================================================
   * ERROR
   * =====================================================
   */

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/sales/list",
            )
          }
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  /*
   * =====================================================
   * NO SALE
   * =====================================================
   */

  if (!isDirectMode && !sale) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-lg border p-4">
          Sales bill not found.
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/sales/list",
            )
          }
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  /*
   * =====================================================
   * REFUND STAGE
   * =====================================================
   */

  if (refundStage) {
    return (
      <div className="space-y-6 p-6">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Sales Return — Refund
            </h1>

            <p className="text-sm text-muted-foreground">
              {isDirectMode
                ? "Direct Return (no bill)"
                : `Bill ${sale?.billNo}`}
            </p>
          </div>

          <button
            type="button"
            onClick={backToItems}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Back to Items
          </button>
        </div>

        {/* RETURN SUMMARY */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-background p-5">
            <div className="text-xs text-muted-foreground">
              Items Returned
            </div>

            <div className="mt-1 text-xl font-bold">
              {formatInteger(
                totalReturnQty,
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-background p-5">
            <div className="text-xs text-muted-foreground">
              Taxable Amount
            </div>

            <div className="mt-1 text-xl font-bold">
              {formatCurrency(
                totalTaxable,
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-background p-5">
            <div className="text-xs text-muted-foreground">
              Refund Amount
            </div>

            <div className="mt-1 text-xl font-bold">
              {formatCurrency(
                totalReturnAmount,
              )}
            </div>
          </div>
        </div>

        {/* REFUND ALLOCATION */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-background">
            <div className="border-b p-5">
              <h2 className="font-semibold">
                Refund Mode
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Select one or more refund
                modes.
              </p>
            </div>

            <div className="p-5">
              {/* QUICK MODES */}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(
                  [
                    "CASH",
                    "UPI",
                    "CARD",
                    "CREDIT",
                  ] as RefundMode[]
                ).map((mode) => {
                  const selected =
                    refundLines.some(
                      (line) =>
                        line.paymentMode ===
                        mode,
                    );

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        if (
                          selected
                        ) {
                          removeRefundMode(
                            mode,
                          );
                        } else {
                          addRefundMode(
                            mode,
                          );
                        }
                      }}
                      className={`rounded-md border px-4 py-3 text-sm font-medium ${
                        selected
                          ? "border-foreground bg-muted"
                          : "hover:bg-muted"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>

              {/* REFUND LINES */}

              <div className="mt-6 space-y-3">
                {refundLines.map(
                  (line) => (
                    <div
                      key={
                        line.paymentMode
                      }
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <div className="w-20 font-medium">
                        {
                          line.paymentMode
                        }
                      </div>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          line.amount ===
                          0
                            ? ""
                            : line.amount
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRefundAmount(
                            line.paymentMode,
                            event
                              .target
                              .value,
                          )
                        }
                        className="flex-1 rounded-md border px-3 py-2 text-right outline-none focus:ring-2"
                        placeholder="0.00"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeRefundMode(
                            line.paymentMode,
                          )
                        }
                        className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                      >
                        Remove
                      </button>
                    </div>
                  ),
                )}
              </div>

              {refundLines.length ===
                0 && (
                <div className="mt-6 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Select a refund mode
                  above.
                </div>
              )}

              {/* QUICK SINGLE MODE BUTTONS */}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    useSingleRefundMode(
                      "CASH",
                    )
                  }
                  className="rounded-md border px-3 py-2 text-xs hover:bg-muted"
                >
                  Full CASH
                </button>

                <button
                  type="button"
                  onClick={() =>
                    useSingleRefundMode(
                      "UPI",
                    )
                  }
                  className="rounded-md border px-3 py-2 text-xs hover:bg-muted"
                >
                  Full UPI
                </button>

                <button
                  type="button"
                  onClick={() =>
                    useSingleRefundMode(
                      "CARD",
                    )
                  }
                  className="rounded-md border px-3 py-2 text-xs hover:bg-muted"
                >
                  Full CARD
                </button>

                <button
                  type="button"
                  onClick={() =>
                    useSingleRefundMode(
                      "CREDIT",
                    )
                  }
                  className="rounded-md border px-3 py-2 text-xs hover:bg-muted"
                >
                  Full CREDIT
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY */}

          <div className="rounded-lg border bg-background p-5">
            <h2 className="font-semibold">
              Refund Summary
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Refund Amount
                </span>

                <span className="font-semibold">
                  {formatCurrency(
                    totalReturnAmount,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Allocated
                </span>

                <span className="font-semibold">
                  {formatCurrency(
                    refundAllocated,
                  )}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    Remaining
                  </span>

                  <span
                    className={`font-bold ${
                      refundExact
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      Math.max(
                        0,
                        refundRemaining,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>

            {refundExact && (
              <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Refund allocation
                matches the return
                amount.
              </div>
            )}

            {refundRemaining >
              0.01 && (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Allocate{" "}
                {formatCurrency(
                  refundRemaining,
                )}{" "}
                more.
              </div>
            )}

            {refundRemaining <
              -0.01 && (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Refund allocation is{" "}
                {formatCurrency(
                  Math.abs(
                    refundRemaining,
                  ),
                )}{" "}
                too high.
              </div>
            )}

            {refundError && (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {refundError}
              </div>
            )}

            <button
              type="button"
              disabled={
                !refundExact ||
                refundLines.length ===
                  0
              }
              onClick={
                confirmRefund
              }
              className="mt-6 w-full rounded-md bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Refund
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * DIRECT RETURN - ITEM SELECTION STAGE
   * =====================================================
   */

  if (isDirectMode) {
    const searchResults =
      directSearchResults();

    return (
      <div className="space-y-6 p-6">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Direct Sales Return
            </h1>

            <p className="text-sm text-muted-foreground">
              Return items without a
              previous sales bill
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/sales/returns",
              )
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Back
          </button>
        </div>

        {/* WAREHOUSE / CUSTOMER */}

        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-background p-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Warehouse *
            </label>

            <select
              value={
                directWarehouseId
              }
              onChange={(event) =>
                setDirectWarehouseId(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">
                Select Warehouse
              </option>

              {warehouses.map(
                (warehouse) => (
                  <option
                    key={
                      warehouse.id
                    }
                    value={
                      warehouse.id
                    }
                  >
                    {warehouse.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Customer (optional)
            </label>

            <select
              value={
                directCustomerId
              }
              onChange={(event) =>
                setDirectCustomerId(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">
                CASH CUSTOMER
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={
                      customer.id
                    }
                    value={
                      customer.id
                    }
                  >
                    {
                      customer.customerCode
                    }{" "}
                    - {customer.name}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {/* ITEM SEARCH */}

        <div className="rounded-lg border bg-background p-5">
          <h2 className="mb-3 font-semibold">
            Items
          </h2>

          <input
            type="text"
            value={directSearch}
            onChange={(event) =>
              setDirectSearch(
                event.target.value,
              )
            }
            placeholder="Search item code or name..."
            className="w-full rounded-md border-2 px-4 py-3 text-sm outline-none focus:border-black"
          />

          {searchResults.length >
            0 && (
            <div className="mt-2 overflow-hidden rounded-md border bg-white shadow">
              {searchResults.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      addDirectRow(
                        item.id,
                      )
                    }
                    className="block w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="font-medium">
                      {item.itemCode}{" "}
                      - {item.name}
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {/* ITEMS TABLE */}

        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="p-3 text-left">
                    #
                  </th>

                  <th className="p-3 text-left">
                    Item
                  </th>

                  <th className="p-3 text-left">
                    Batch
                  </th>

                  <th className="p-3 text-right">
                    Qty
                  </th>

                  <th className="p-3 text-right">
                    Rate
                  </th>

                  <th className="p-3 text-right">
                    GST %
                  </th>

                  <th className="p-3 text-right">
                    Amount
                  </th>

                  <th className="p-3 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {returnRows.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No items added.
                    </td>
                  </tr>
                ) : (
                  returnRows.map(
                    (row, index) => {
                      const itemBatches =
                        directBatches.filter(
                          (batch) =>
                            batch.itemId ===
                            row.itemId,
                        );

                      const lineTaxable =
                        row.returnQty *
                        row.saleRate;

                      const lineGst =
                        lineTaxable *
                        (row.gstPercent /
                          100);

                      const lineTotal =
                        lineTaxable +
                        lineGst;

                      return (
                        <tr
                          key={`${row.itemId}-${row.batchId}-${index}`}
                          className="border-b last:border-b-0"
                        >
                          <td className="p-3 align-top">
                            {index +
                              1}
                          </td>

                          <td className="p-3 align-top">
                            <div className="font-medium">
                              {
                                row.itemName
                              }
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {
                                row.itemCode
                              }
                            </div>
                          </td>

                          <td className="p-2 align-top">
                            <select
                              value={
                                row.batchId
                              }
                              onChange={(
                                event,
                              ) =>
                                updateDirectBatch(
                                  index,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-full rounded border px-2 py-1.5 text-sm"
                            >
                              <option value="">
                                Select
                                Batch
                              </option>

                              {itemBatches.map(
                                (
                                  batch,
                                ) => (
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
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </td>

                          <td className="p-2 text-right align-top">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                row.returnQty ===
                                0
                                  ? ""
                                  : row.returnQty
                              }
                              onChange={(
                                event,
                              ) =>
                                updateReturnQty(
                                  index,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-20 rounded border px-2 py-1.5 text-right"
                              placeholder="0"
                            />
                          </td>

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
                                updateDirectRate(
                                  index,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-24 rounded border px-2 py-1.5 text-right"
                            />
                          </td>

                          <td className="p-2 text-right align-top">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                row.gstPercent
                              }
                              onChange={(
                                event,
                              ) =>
                                updateDirectGst(
                                  index,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-20 rounded border px-2 py-1.5 text-right"
                            />
                          </td>

                          <td className="p-3 text-right align-top font-medium">
                            {row.returnQty >
                            0
                              ? formatCurrency(
                                  lineTotal,
                                )
                              : "-"}
                          </td>

                          <td className="p-2 text-center align-top">
                            <button
                              type="button"
                              onClick={() =>
                                removeDirectRow(
                                  index,
                                )
                              }
                              className="rounded border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
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

        {/* RETURN SUMMARY */}

        <div className="flex justify-end">
          <div className="w-full max-w-md rounded-lg border bg-background p-5">
            <div className="mb-4 font-semibold">
              Return Summary
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Return Quantity
                </span>

                <span className="font-medium">
                  {formatInteger(
                    totalReturnQty,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Taxable Amount
                </span>

                <span className="font-medium">
                  {formatCurrency(
                    totalTaxable,
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  GST
                </span>

                <span className="font-medium">
                  {formatCurrency(
                    totalGst,
                  )}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold">
                    Refund Amount
                  </span>

                  <span className="font-bold">
                    {formatCurrency(
                      totalReturnAmount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {directItemError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {directItemError}
              </div>
            )}

            <button
              type="button"
              disabled={
                selectedRows.length ===
                0
              }
              onClick={
                continueToRefund
              }
              className="mt-5 w-full rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Refund
            </button>

            {selectedRows.length ===
              0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Add at least one item
                to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * ITEM SELECTION STAGE
   *
   * isDirectMode is false past this point (handled above), and the
   * page-level guard already returned when !sale - this re-check
   * only lets TS narrow `sale` to non-null for the JSX below.
   * =====================================================
   */

  if (!sale) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Sales Return
          </h1>

          <p className="text-sm text-muted-foreground">
            Create a return against an
            existing sales bill
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/sales/view/${sale.id}`,
              )
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            View Bill
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/sales/list",
              )
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Back
          </button>
        </div>
      </div>

      {/* BILL INFORMATION */}

      <div className="grid grid-cols-1 gap-4 rounded-lg border bg-background p-5 md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">
            Bill No
          </div>

          <div className="font-medium">
            {sale.billNo}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Bill Date
          </div>

          <div className="font-medium">
            {formatDate(
              sale.billDate,
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Customer
          </div>

          <div className="font-medium">
            {sale.customer?.name ??
              "CASH CUSTOMER"}
          </div>

          {sale.customer
            ?.customerCode && (
            <div className="text-xs text-muted-foreground">
              {
                sale.customer
                  .customerCode
              }
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Warehouse
          </div>

          <div className="font-medium">
            {sale.warehouse?.name ??
              "-"}
          </div>
        </div>
      </div>

      {/* PREVIOUS RETURNS */}

      {previousReturns.length >
        0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="font-medium text-amber-900">
            Previous returns found
          </div>

          <div className="mt-1 text-sm text-amber-800">
            This bill has{" "}
            {previousReturns.length}{" "}
            previous sales return
            {previousReturns.length !==
            1
              ? "s"
              : ""}.
            Returnable quantities have
            been reduced automatically.
          </div>
        </div>
      )}

      {/* ACTIONS */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            Items
          </h2>

          <p className="text-sm text-muted-foreground">
            Select the quantity you want
            to return.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={
              selectAllReturnable
            }
            disabled={
              returnRows.length === 0
            }
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Select All Returnable
          </button>

          <button
            type="button"
            onClick={
              clearReturnQuantities
            }
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ITEMS TABLE */}

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <th className="p-3 text-left">
                  #
                </th>

                <th className="p-3 text-left">
                  Item
                </th>

                <th className="p-3 text-left">
                  Batch
                </th>

                <th className="p-3 text-right">
                  Sold
                </th>

                <th className="p-3 text-right">
                  Returned
                </th>

                <th className="p-3 text-right">
                  Returnable
                </th>

                <th className="p-3 text-right">
                  Return Qty
                </th>

                <th className="p-3 text-right">
                  Rate
                </th>

                <th className="p-3 text-right">
                  GST
                </th>

                <th className="p-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {returnRows.map(
                (row, index) => {
                  const lineTaxable =
                    row.returnQty *
                    row.saleRate;

                  const lineGst =
                    lineTaxable *
                    (row.gstPercent /
                      100);

                  const lineTotal =
                    lineTaxable +
                    lineGst;

                  const fullyReturned =
                    row.returnableQty <=
                    0;

                  return (
                    <tr
                      key={`${row.itemId}:${row.batchId}`}
                      className="border-b last:border-b-0"
                    >
                      <td className="p-3">
                        {index + 1}
                      </td>

                      <td className="p-3">
                        <div className="font-medium">
                          {
                            row.itemName
                          }
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {
                            row.itemCode
                          }
                        </div>
                      </td>

                      <td className="p-3">
                        {row.batchNo}
                      </td>

                      <td className="p-3 text-right">
                        {formatInteger(
                          row.soldQty,
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {formatInteger(
                          row.returnedQty,
                        )}
                      </td>

                      <td className="p-3 text-right font-semibold">
                        {formatInteger(
                          row.returnableQty,
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {fullyReturned ? (
                          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            FULLY RETURNED
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={
                              row.returnableQty
                            }
                            step="0.01"
                            value={
                              row.returnQty ===
                              0
                                ? ""
                                : row.returnQty
                            }
                            onChange={(
                              event,
                            ) =>
                              updateReturnQty(
                                index,
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="w-24 rounded-md border px-2 py-1.5 text-right outline-none focus:ring-2"
                            placeholder="0"
                          />
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {formatCurrency(
                          row.saleRate,
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {row.gstPercent}%
                      </td>

                      <td className="p-3 text-right font-medium">
                        {row.returnQty >
                        0
                          ? formatCurrency(
                              lineTotal,
                            )
                          : "-"}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPTY */}

      {returnRows.length ===
        0 && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No items found on this sales
          bill.
        </div>
      )}

      {/* FULLY RETURNED */}

      {returnRows.length > 0 &&
        returnRows.every(
          (row) =>
            row.returnableQty <= 0,
        ) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            All items on this sales bill
            have already been returned.
          </div>
        )}

      {/* RETURN SUMMARY */}

      <div className="flex justify-end">
        <div className="w-full max-w-md rounded-lg border bg-background p-5">
          <div className="mb-4 font-semibold">
            Return Summary
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Return Quantity
              </span>

              <span className="font-medium">
                {formatInteger(
                  totalReturnQty,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Taxable Amount
              </span>

              <span className="font-medium">
                {formatCurrency(
                  totalTaxable,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                GST
              </span>

              <span className="font-medium">
                {formatCurrency(
                  totalGst,
                )}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-base">
                <span className="font-semibold">
                  Refund Amount
                </span>

                <span className="font-bold">
                  {formatCurrency(
                    totalReturnAmount,
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={
              selectedRows.length ===
              0
            }
            onClick={
              continueToRefund
            }
            className="mt-5 w-full rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Refund
          </button>

          {selectedRows.length ===
            0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Select at least one item to
              continue.
            </p>
          )}

          {allReturnableSelected &&
            selectedRows.length >
              0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                All remaining quantities
                selected.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

/*
 * =====================================================
 * PAGE
 * =====================================================
 */

export default function SaleReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          Loading sales return...
        </div>
      }
    >
      <SaleReturnContent />
    </Suspense>
  );
}
