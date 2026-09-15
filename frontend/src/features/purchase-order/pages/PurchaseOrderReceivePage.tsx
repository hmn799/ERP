"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getPurchaseOrderById,
  receivePurchaseOrder,
} from "../services/purchase-order.service";

import {
  PurchaseOrderResponse,
  PurchaseOrderItemResponse,
  ReceivePurchaseOrderDto,
} from "../types/purchase-order.types";

interface Props {
  purchaseOrderId: string;
}

interface ReceiveRow {
  qtyReceived: string;
  batchNo: string;
  expiryDate: string;
  purchaseRate: string;
  retailRate: string;
  wholesaleRate: string;
  distributorRate: string;
  mrp: string;
  barcode: string;
}

function getNumber(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const n = Number(value ?? 0);

  return Number.isFinite(n) ? n : 0;
}

function today() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
}

export default function PurchaseOrderReceivePage({
  purchaseOrderId,
}: Props) {
  const router = useRouter();

  const [
    purchaseOrder,
    setPurchaseOrder,
  ] =
    useState<PurchaseOrderResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    receiveRows,
    setReceiveRows,
  ] =
    useState<
      Record<string, ReceiveRow>
    >({});

  const [billNo, setBillNo] =
    useState("");

  const [billDate, setBillDate] =
    useState(today());

  const [invoiceNo, setInvoiceNo] =
    useState("");

  const [
    invoiceDate,
    setInvoiceDate,
  ] = useState("");

  const [remarks, setRemarks] =
    useState("");

  async function loadPurchaseOrder() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getPurchaseOrderById(
          purchaseOrderId,
        );

      setPurchaseOrder(data);

      const rows: Record<
        string,
        ReceiveRow
      > = {};

      for (const item of
        data.items ?? []) {
        const pending =
          getNumber(
            item.pendingQty,
          );

        if (pending <= 0) {
          continue;
        }

        rows[item.id] = {
          qtyReceived:
            String(pending),

          batchNo: "",

          expiryDate: "",

          purchaseRate:
            String(
              getNumber(
                item.purchaseRate,
              ),
            ),

          retailRate: "",

          wholesaleRate: "",

          distributorRate: "",

          mrp: "",

          barcode:
            item.item
              ?.barcode ??
            "",
        };
      }

      setReceiveRows(rows);
    } catch (err) {
      console.error(
        "Failed to load purchase order:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchase order.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!purchaseOrderId) {
      return;
    }

    loadPurchaseOrder();
  }, [purchaseOrderId]);

  const pendingItems =
    useMemo(
      () =>
        (
          purchaseOrder?.items ??
          []
        ).filter(
          (item) =>
            getNumber(
              item.pendingQty,
            ) > 0,
        ),
      [purchaseOrder],
    );

  const totalPending =
    useMemo(
      () =>
        pendingItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            getNumber(
              item.pendingQty,
            ),
          0,
        ),
      [pendingItems],
    );

  const totalReceiving =
    useMemo(
      () =>
        pendingItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            getNumber(
              receiveRows[
                item.id
              ]?.qtyReceived,
            ),
          0,
        ),
      [
        pendingItems,
        receiveRows,
      ],
    );

  function updateRow(
    itemId: string,
    field: keyof ReceiveRow,
    value: string,
  ) {
    setReceiveRows(
      (current) => ({
        ...current,

        [itemId]: {
          ...current[itemId],
          [field]: value,
        },
      }),
    );
  }

  function validate() {
    if (!purchaseOrder) {
      return "Purchase order not found.";
    }

    if (
      pendingItems.length === 0
    ) {
      return "There is no pending quantity to receive.";
    }

    if (
      totalReceiving <= 0
    ) {
      return "Enter received quantity.";
    }

    for (const item of
      pendingItems) {
      const row =
        receiveRows[item.id];

      const pending =
        getNumber(
          item.pendingQty,
        );

      const qty =
        getNumber(
          row?.qtyReceived,
        );

      if (qty <= 0) {
        return `Enter received quantity for ${item.item?.name ?? "item"}.`;
      }

      if (qty > pending) {
        return `Received quantity for ${item.item?.name ?? "item"} cannot exceed pending quantity ${pending}.`;
      }

      if (
        !row?.batchNo?.trim()
      ) {
        return `Enter batch number for ${item.item?.name ?? "item"}.`;
      }
    }

    return null;
  }

  async function handleReceive() {
    const validation =
      validate();

    if (validation) {
      setError(validation);
      return;
    }

    if (!purchaseOrder) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const dto: ReceivePurchaseOrderDto =
        {
          billNo:
            billNo.trim() ||
            undefined,

          billDate:
            billDate
              ? billDate
              : undefined,

          invoiceNo:
            invoiceNo.trim() ||
            undefined,

          invoiceDate:
            invoiceDate
              ? invoiceDate
              : undefined,

          remarks:
            remarks.trim() ||
            undefined,

          items:
            pendingItems.map(
              (item) => {
                const row =
                  receiveRows[
                    item.id
                  ];

                const result: any =
                  {
                    purchaseOrderItemId:
                      item.id,

                    qtyReceived:
                      getNumber(
                        row.qtyReceived,
                      ),

                    batchNo:
                      row.batchNo.trim(),

                    purchaseRate:
                      getNumber(
                        row.purchaseRate,
                      ),
                  };

                if (
                  row.expiryDate
                ) {
                  result.expiryDate =
                    row.expiryDate;
                }

                if (
                  row.retailRate !==
                  ""
                ) {
                  result.retailRate =
                    getNumber(
                      row.retailRate,
                    );
                }

                if (
                  row.wholesaleRate !==
                  ""
                ) {
                  result.wholesaleRate =
                    getNumber(
                      row.wholesaleRate,
                    );
                }

                if (
                  row.distributorRate !==
                  ""
                ) {
                  result.distributorRate =
                    getNumber(
                      row.distributorRate,
                    );
                }

                if (
                  row.mrp !==
                  ""
                ) {
                  result.mrp =
                    getNumber(
                      row.mrp,
                    );
                }

                if (
                  row.barcode.trim()
                ) {
                  result.barcode =
                    row.barcode.trim();
                }

                return result;
              },
            ),
        };

      await receivePurchaseOrder(
        purchaseOrder.id,
        dto,
      );

      router.push(
        `/purchase-order/view/${purchaseOrder.id}`,
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Failed to receive purchase order:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to receive purchase order.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading receive screen...
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="space-y-4 p-6">

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ??
            "Purchase order not found."}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/purchase-order/list",
            )
          }
          className="rounded-md border px-4 py-2 text-sm"
        >
          Back
        </button>

      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Receive Purchase Order
          </h1>

          <p className="text-sm text-gray-500">
            {purchaseOrder.poNo}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/purchase-order/view/${purchaseOrder.id}`,
            )
          }
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to PO
        </button>

      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          PO SUMMARY
          ===================================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            PO Number
          </div>

          <div className="mt-2 font-bold">
            {purchaseOrder.poNo}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            Supplier
          </div>

          <div className="mt-2 font-bold">
            {purchaseOrder.supplier
              ?.name ??
              "-"}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            Warehouse
          </div>

          <div className="mt-2 font-bold">
            {purchaseOrder.warehouse
              ?.name ??
              "-"}
          </div>
        </div>

      </div>

      {/* =====================================================
          BILL INFORMATION
          ===================================================== */}

      <div className="rounded-lg border bg-white p-5">

        <h2 className="mb-5 text-lg font-semibold">
          Purchase Bill Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Bill No.
            </label>

            <input
              type="text"
              value={billNo}
              onChange={(event) =>
                setBillNo(
                  event.target.value,
                )
              }
              placeholder="Auto generated if blank"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Bill Date
            </label>

            <input
              type="date"
              value={billDate}
              onChange={(event) =>
                setBillDate(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Supplier Invoice No.
            </label>

            <input
              type="text"
              value={invoiceNo}
              onChange={(event) =>
                setInvoiceNo(
                  event.target.value,
                )
              }
              placeholder="Optional"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Supplier Invoice Date
            </label>

            <input
              type="date"
              value={invoiceDate}
              onChange={(event) =>
                setInvoiceDate(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

        </div>

        <div className="mt-4">

          <label className="mb-1 block text-sm font-medium">
            Remarks
          </label>

          <textarea
            value={remarks}
            onChange={(event) =>
              setRemarks(
                event.target.value,
              )
            }
            rows={3}
            placeholder="Optional"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

        </div>

      </div>

      {/* =====================================================
          RECEIVING ITEMS
          ===================================================== */}

      <div className="overflow-hidden rounded-lg border bg-white">

        <div className="flex flex-col gap-2 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold">
              Items to Receive
            </h2>

            <p className="text-xs text-gray-500">
              Enter batch and receiving details.
            </p>
          </div>

          <div className="text-sm">
            Pending:
            <span className="ml-1 font-bold">
              {totalPending}
            </span>

            <span className="mx-2">
              |
            </span>

            Receiving:
            <span className="ml-1 font-bold">
              {totalReceiving}
            </span>
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1500px] text-sm">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-3 py-3 text-left">
                  Item
                </th>

                <th className="px-3 py-3 text-right">
                  Pending
                </th>

                <th className="px-3 py-3 text-right">
                  Receive Qty
                </th>

                <th className="px-3 py-3 text-left">
                  Batch No.
                </th>

                <th className="px-3 py-3 text-left">
                  Expiry
                </th>

                <th className="px-3 py-3 text-right">
                  P.Rate
                </th>

                <th className="px-3 py-3 text-right">
                  Retail
                </th>

                <th className="px-3 py-3 text-right">
                  Wholesale
                </th>

                <th className="px-3 py-3 text-right">
                  Distributor
                </th>

                <th className="px-3 py-3 text-right">
                  MRP
                </th>

                <th className="px-3 py-3 text-left">
                  Barcode
                </th>

              </tr>

            </thead>

            <tbody>

              {pendingItems.map(
                (item) => {
                  const row =
                    receiveRows[
                      item.id
                    ];

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                    >

                      <td className="px-3 py-4">

                        <div className="font-medium">
                          {item.item
                            ?.name ??
                            "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.item
                            ?.itemCode ??
                            ""}
                        </div>

                      </td>

                      <td className="px-3 py-4 text-right font-semibold">
                        {getNumber(
                          item.pendingQty,
                        )}
                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="number"
                          min="0"
                          max={getNumber(
                            item.pendingQty,
                          )}
                          step="0.01"
                          value={
                            row?.qtyReceived ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "qtyReceived",
                              event.target
                                .value,
                            )
                          }
                          className="w-28 rounded-md border px-2 py-2 text-right"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="text"
                          value={
                            row?.batchNo ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "batchNo",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Batch"
                          className="w-32 rounded-md border px-2 py-2"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="date"
                          value={
                            row?.expiryDate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "expiryDate",
                              event.target
                                .value,
                            )
                          }
                          className="rounded-md border px-2 py-2"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row?.purchaseRate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "purchaseRate",
                              event.target
                                .value,
                            )
                          }
                          className="w-28 rounded-md border px-2 py-2 text-right"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row?.retailRate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "retailRate",
                              event.target
                                .value,
                            )
                          }
                          placeholder="0"
                          className="w-28 rounded-md border px-2 py-2 text-right"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row?.wholesaleRate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "wholesaleRate",
                              event.target
                                .value,
                            )
                          }
                          placeholder="0"
                          className="w-28 rounded-md border px-2 py-2 text-right"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row?.distributorRate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "distributorRate",
                              event.target
                                .value,
                            )
                          }
                          placeholder="0"
                          className="w-28 rounded-md border px-2 py-2 text-right"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row?.mrp ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "mrp",
                              event.target
                                .value,
                            )
                          }
                          placeholder="0"
                          className="w-28 rounded-md border px-2 py-2 text-right"
                        />

                      </td>

                      <td className="px-3 py-4">

                        <input
                          type="text"
                          value={
                            row?.barcode ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              item.id,
                              "barcode",
                              event.target
                                .value,
                            )
                          }
                          className="w-36 rounded-md border px-2 py-2"
                        />

                      </td>

                    </tr>
                  );
                },
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="flex flex-col gap-3 rounded-lg border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="text-sm text-gray-500">
          Receiving{" "}
          <span className="font-semibold text-gray-900">
            {totalReceiving}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {totalPending}
          </span>{" "}
          pending quantity.
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              router.push(
                `/purchase-order/view/${purchaseOrder.id}`,
              )
            }
            className="rounded-md border px-5 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              saving ||
              pendingItems.length ===
                0
            }
            onClick={
              handleReceive
            }
            className="rounded-md bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Receiving..."
              : "Receive & Create Purchase Bill"}
          </button>

        </div>

      </div>

    </div>
  );
}