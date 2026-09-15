"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getPurchaseOrderById,
  cancelPurchaseOrder,
} from "../services/purchase-order.service";

import {
  PurchaseOrderResponse,
  PurchaseOrderItemResponse,
} from "../types/purchase-order.types";

interface Props {
  purchaseOrderId: string;
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

function formatAmount(
  value:
    | number
    | string
    | null
    | undefined,
) {
  return getNumber(value).toFixed(2);
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-IN",
  );
}

function statusClass(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
      return "border-green-200 bg-green-50 text-green-700";

    case "PARTIAL":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-gray-200 bg-white text-gray-700";
  }
}

export default function PurchaseOrderViewPage({
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

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [cancelling, setCancelling] =
    useState(false);

  async function loadPurchaseOrder(
    showRefresh = false,
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data =
        await getPurchaseOrderById(
          purchaseOrderId,
        );

      setPurchaseOrder(data);
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
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!purchaseOrderId) {
      return;
    }

    loadPurchaseOrder();
  }, [purchaseOrderId]);

  async function handleCancel() {
    if (!purchaseOrder) {
      return;
    }

    const confirmed =
      window.confirm(
        `Cancel purchase order ${purchaseOrder.poNo}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);
      setError(null);

      const updated =
        await cancelPurchaseOrder(
          purchaseOrder.id,
        );

      setPurchaseOrder(updated);
    } catch (err) {
      console.error(
        "Failed to cancel purchase order:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel purchase order.",
      );
    } finally {
      setCancelling(false);
    }
  }

  const items =
    purchaseOrder?.items ?? [];

  const pendingItems = useMemo(
    () =>
      items.filter(
        (
          item: PurchaseOrderItemResponse,
        ) =>
          getNumber(
            item.pendingQty,
          ) > 0,
      ),
    [items],
  );

  const totalOrderedQty =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            getNumber(
              item.qtyOrdered,
            ),
          0,
        ),
      [items],
    );

  const totalReceivedQty =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            getNumber(
              item.qtyReceived,
            ),
          0,
        ),
      [items],
    );

  const totalPendingQty =
    useMemo(
      () =>
        items.reduce(
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
      [items],
    );

  const canReceive =
    purchaseOrder !== null &&
    purchaseOrder.status !==
      "CANCELLED" &&
    purchaseOrder.status !==
      "COMPLETED" &&
    pendingItems.length > 0;

  const canCancel =
    purchaseOrder !== null &&
    purchaseOrder.status !==
      "CANCELLED" &&
    purchaseOrder.status !==
      "COMPLETED";

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading purchase order...
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
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Purchase Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Purchase Order
          </h1>

          <p className="text-sm text-gray-500">
            {purchaseOrder.poNo}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {/* RECEIVE BUTTON */}

          {canReceive && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/purchase-order/view/${purchaseOrder.id}/receive`,
                )
              }
              className="rounded-md bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Receive
            </button>
          )}

          {/* CANCEL */}

          {canCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancel}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel PO"}
            </button>
          )}

          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/purchase-order/list",
              )
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </button>

          {/* REFRESH */}

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              loadPurchaseOrder(true)
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>
      </div>

      {/* =====================================================
          BASIC INFORMATION
          ===================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            PO Number
          </div>

          <div className="mt-2 text-lg font-bold">
            {purchaseOrder.poNo}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            PO Date
          </div>

          <div className="mt-2 text-lg font-bold">
            {formatDate(
              purchaseOrder.poDate,
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            Supplier
          </div>

          <div className="mt-2 text-lg font-bold">
            {purchaseOrder.supplier
              ?.name ??
              "-"}
          </div>

          {purchaseOrder.supplier
            ?.supplierCode && (
            <div className="mt-1 text-xs text-gray-500">
              {
                purchaseOrder
                  .supplier
                  .supplierCode
              }
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-xs text-gray-500">
            Warehouse
          </div>

          <div className="mt-2 text-lg font-bold">
            {purchaseOrder.warehouse
              ?.name ??
              "-"}
          </div>
        </div>

      </div>

      {/* =====================================================
          STATUS
          ===================================================== */}

      <div className="rounded-lg border bg-white p-5">

        <div className="mb-2 text-xs text-gray-500">
          Status
        </div>

        <span
          className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusClass(
            purchaseOrder.status,
          )}`}
        >
          {purchaseOrder.status}
        </span>

      </div>

      {/* =====================================================
          RECEIVING SUMMARY
          ===================================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-gray-500">
            Ordered Quantity
          </div>

          <div className="mt-2 text-2xl font-bold">
            {totalOrderedQty}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-gray-500">
            Received Quantity
          </div>

          <div className="mt-2 text-2xl font-bold">
            {totalReceivedQty}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-gray-500">
            Pending Quantity
          </div>

          <div className="mt-2 text-2xl font-bold">
            {totalPendingQty}
          </div>
        </div>

      </div>

      {/* =====================================================
          PURCHASE ORDER ITEMS
          ===================================================== */}

      <div className="overflow-hidden rounded-lg border bg-white">

        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Purchase Order Items
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px] text-sm">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-3 py-3 text-left">
                  Item
                </th>

                <th className="px-3 py-3 text-right">
                  Ordered
                </th>

                <th className="px-3 py-3 text-right">
                  Received
                </th>

                <th className="px-3 py-3 text-right">
                  Pending
                </th>

                <th className="px-3 py-3 text-right">
                  P.Rate
                </th>

                <th className="px-3 py-3 text-right">
                  Discount
                </th>

                <th className="px-3 py-3 text-right">
                  GST
                </th>

                <th className="px-3 py-3 text-right">
                  Taxable
                </th>

                <th className="px-3 py-3 text-right">
                  Net
                </th>

              </tr>

            </thead>

            <tbody>

              {items.map(
                (
                  item,
                ) => (
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
                        {item.item
                          ?.barcode
                          ? ` • ${item.item.barcode}`
                          : ""}
                      </div>

                    </td>

                    <td className="px-3 py-4 text-right">
                      {getNumber(
                        item.qtyOrdered,
                      )}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {getNumber(
                        item.qtyReceived,
                      )}
                    </td>

                    <td className="px-3 py-4 text-right font-semibold">
                      {getNumber(
                        item.pendingQty,
                      )}
                    </td>

                    <td className="px-3 py-4 text-right">
                      ₹
                      {formatAmount(
                        item.purchaseRate,
                      )}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {formatAmount(
                        item.discountPercent,
                      )}
                      %
                    </td>

                    <td className="px-3 py-4 text-right">
                      {formatAmount(
                        item.gstPercent,
                      )}
                      %
                    </td>

                    <td className="px-3 py-4 text-right">
                      ₹
                      {formatAmount(
                        item.taxableAmount,
                      )}
                    </td>

                    <td className="px-3 py-4 text-right font-medium">
                      ₹
                      {formatAmount(
                        item.netAmount,
                      )}
                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>

        </div>

        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No items found.
          </div>
        )}

      </div>

      {/* =====================================================
          ORDER SUMMARY
          ===================================================== */}

      <div className="flex justify-end">

        <div className="w-full max-w-md rounded-lg border bg-white p-5">

          <h2 className="mb-4 text-lg font-semibold">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span>
                Gross Amount
              </span>

              <span>
                ₹
                {formatAmount(
                  purchaseOrder.grossAmount,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Discount
              </span>

              <span>
                ₹
                {formatAmount(
                  purchaseOrder.discountAmount,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Taxable Amount
              </span>

              <span>
                ₹
                {formatAmount(
                  purchaseOrder.taxableAmount,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                CGST
              </span>

              <span>
                ₹
                {formatAmount(
                  purchaseOrder.cgstAmount,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                SGST
              </span>

              <span>
                ₹
                {formatAmount(
                  purchaseOrder.sgstAmount,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                IGST
              </span>

              <span>
                ₹
                {formatAmount(
                  purchaseOrder.igstAmount,
                )}
              </span>
            </div>

            <div className="border-t pt-3">

              <div className="flex justify-between text-lg font-bold">

                <span>
                  Net Amount
                </span>

                <span>
                  ₹
                  {formatAmount(
                    purchaseOrder.netAmount,
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          REMARKS
          ===================================================== */}

      {purchaseOrder.remarks && (
        <div className="rounded-lg border bg-white p-5">

          <div className="mb-2 text-xs text-gray-500">
            Remarks
          </div>

          <div className="text-sm">
            {purchaseOrder.remarks}
          </div>

        </div>
      )}

    </div>
  );
}