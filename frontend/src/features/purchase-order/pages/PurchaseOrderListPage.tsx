"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getPurchaseOrders,
} from "../services/purchase-order.service";

import {
  PurchaseOrderListItem,
  PurchaseOrderResponse,
} from "../types/purchase-order.types";

function getNumber(
  value: number | string | null | undefined,
) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function formatAmount(
  value: number | string | null | undefined,
) {
  return getNumber(value).toFixed(2);
}

function formatDate(
  value: string,
) {
  return new Date(value).toLocaleDateString(
    "en-IN",
  );
}

function normalizePurchaseOrder(
  po: PurchaseOrderResponse,
): PurchaseOrderListItem {
  const items = po.items ?? [];

  return {
    id: po.id,
    poNo: po.poNo,
    poDate: po.poDate,
    supplierId: po.supplierId,
    supplierName:
      po.supplier?.name ?? "-",
    warehouseId: po.warehouseId,
    warehouseName:
      po.warehouse?.name ?? "-",
    status: po.status,
    totalItems: items.length,
    totalQty: items.reduce(
      (total, item) =>
        total +
        getNumber(item.qtyOrdered),
      0,
    ),
    grossAmount:
      getNumber(po.grossAmount),
    discountAmount:
      getNumber(po.discountAmount),
    taxableAmount:
      getNumber(po.taxableAmount),
    cgstAmount:
      getNumber(po.cgstAmount),
    sgstAmount:
      getNumber(po.sgstAmount),
    igstAmount:
      getNumber(po.igstAmount),
    netAmount:
      getNumber(po.netAmount),
  };
}

export default function PurchaseOrderListPage() {
  const router = useRouter();

  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrderListItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  async function loadPurchaseOrders() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getPurchaseOrders();

      const rows =
        data.map((po) =>
          normalizePurchaseOrder(
            po as PurchaseOrderResponse,
          ),
        );

      setPurchaseOrders(rows);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchase orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const filteredOrders =
    useMemo(() => {
      const searchText =
        search.trim().toLowerCase();

      return purchaseOrders.filter(
        (po) => {
          if (searchText) {
            const poNo =
              po.poNo?.toLowerCase() ?? "";

            const supplier =
              po.supplierName
                ?.toLowerCase() ?? "";

            if (
              !poNo.includes(searchText) &&
              !supplier.includes(searchText)
            ) {
              return false;
            }
          }

          if (
            statusFilter !== "ALL" &&
            po.status !== statusFilter
          ) {
            return false;
          }

          const poDate =
            new Date(po.poDate);

          if (fromDate) {
            const from =
              new Date(
                `${fromDate}T00:00:00`,
              );

            if (poDate < from) {
              return false;
            }
          }

          if (toDate) {
            const to =
              new Date(
                `${toDate}T23:59:59`,
              );

            if (poDate > to) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      purchaseOrders,
      search,
      fromDate,
      toDate,
      statusFilter,
    ]);

  const summary =
    useMemo(() => {
      return filteredOrders.reduce(
        (total, po) => {
          total.orders += 1;
          total.qty += po.totalQty;
          total.net += po.netAmount;

          return total;
        },
        {
          orders: 0,
          qty: 0,
          net: 0,
        },
      );
    }, [filteredOrders]);

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Purchase Orders
          </h1>

          <p className="text-sm text-gray-500">
            Purchase order history
          </p>
        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={loadPurchaseOrders}
            disabled={loading}
            className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/purchase-order/new",
              )
            }
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + New Purchase Order
          </button>

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FILTERS */}

      <div className="rounded-lg border bg-white p-4">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

          <div className="lg:col-span-2">

            <label className="mb-1 block text-xs font-medium text-gray-600">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="PO No. or supplier..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-black"
            />

          </div>

          <div>

            <label className="mb-1 block text-xs font-medium text-gray-600">
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-black"
            />

          </div>

          <div>

            <label className="mb-1 block text-xs font-medium text-gray-600">
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-black"
            />

          </div>

          <div>

            <label className="mb-1 block text-xs font-medium text-gray-600">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

          </div>

        </div>

        <div className="mt-3 flex justify-end">

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs font-medium text-gray-500">
            Orders
          </div>

          <div className="mt-1 text-2xl font-semibold">
            {summary.orders}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs font-medium text-gray-500">
            Total Qty
          </div>

          <div className="mt-1 text-2xl font-semibold">
            {summary.qty}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs font-medium text-gray-500">
            Net Amount
          </div>

          <div className="mt-1 text-2xl font-semibold">
            ₹{formatAmount(summary.net)}
          </div>
        </div>

      </div>

      {/* TABLE */}

      <div className="overflow-x-auto rounded-lg border bg-white">

        <table className="w-full text-sm">

          <thead>
            <tr className="border-b bg-gray-50">

              <th className="p-3 text-left">
                PO No.
              </th>

              <th className="p-3 text-left">
                PO Date
              </th>

              <th className="p-3 text-left">
                Supplier
              </th>

              <th className="p-3 text-left">
                Warehouse
              </th>

              <th className="p-3 text-center">
                Items
              </th>

              <th className="p-3 text-right">
                Qty
              </th>

              <th className="p-3 text-center">
                Status
              </th>

              <th className="p-3 text-right">
                Amount
              </th>

            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-gray-500"
                >
                  Loading purchase orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-gray-500"
                >
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map(
                (po) => (
                  <tr
                    key={po.id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-3">

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/purchase-order/view/${po.id}`,
                          )
                        }
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {po.poNo}
                      </button>

                    </td>

                    <td className="p-3">
                      {formatDate(
                        po.poDate,
                      )}
                    </td>

                    <td className="p-3">
                      {po.supplierName}
                    </td>

                    <td className="p-3">
                      {po.warehouseName}
                    </td>

                    <td className="p-3 text-center">
                      {po.totalItems}
                    </td>

                    <td className="p-3 text-right">
                      {po.totalQty}
                    </td>

                    <td className="p-3 text-center">

                      <span className="rounded-full border px-2 py-1 text-xs">
                        {po.status}
                      </span>

                    </td>

                    <td className="p-3 text-right font-medium">
                      ₹{formatAmount(
                        po.netAmount,
                      )}
                    </td>

                  </tr>
                ),
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
