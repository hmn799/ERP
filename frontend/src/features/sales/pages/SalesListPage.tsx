"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getSales,
} from "../services/sales.service";

import {
  SalesListItem,
} from "../types/sales.types";

export default function SalesListPage() {
  const [sales, setSales] =
    useState<SalesListItem[]>([]);

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

  const [typeFilter, setTypeFilter] =
    useState<
      "ALL" | "CASH" | "CREDIT"
    >("ALL");

  async function loadSales() {
    try {
      setLoading(true);
      setError(null);

      const data = await getSales();

      setSales(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load sales.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

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
    return new Date(
      value,
    ).toLocaleDateString("en-IN");
  }

  function getPaidAmount(
    sale: SalesListItem,
  ) {
    if (sale.isCredit) {
      return 0;
    }

    return (
      sale.payments?.reduce(
        (total, payment) =>
          total +
          getNumber(payment.amount) +
          getNumber(
            payment.cardSurcharge,
          ),
        0,
      ) ?? 0
    );
  }

  function getFinalPayable(
    sale: SalesListItem,
  ) {
    return getNumber(
      sale.finalPayable ??
        sale.netAmount ??
        0,
    );
  }

  function getBalance(
    sale: SalesListItem,
  ) {
    if (sale.isCredit) {
      return getFinalPayable(sale);
    }

    return Math.max(
      getFinalPayable(sale) -
        getPaidAmount(sale),
      0,
    );
  }

  const filteredSales =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return sales.filter(
        (sale) => {
          if (searchText) {
            const billNo =
              sale.billNo
                ?.toLowerCase() ?? "";

            const customer =
              sale.customer?.name
                ?.toLowerCase() ?? "";

            if (
              !billNo.includes(
                searchText,
              ) &&
              !customer.includes(
                searchText,
              )
            ) {
              return false;
            }
          }

          if (
            typeFilter !== "ALL"
          ) {
            const saleType =
              sale.isCredit
                ? "CREDIT"
                : "CASH";

            if (
              saleType !==
              typeFilter
            ) {
              return false;
            }
          }

          const saleDate =
            new Date(
              sale.billDate,
            );

          if (fromDate) {
            const from =
              new Date(
                `${fromDate}T00:00:00`,
              );

            if (
              saleDate < from
            ) {
              return false;
            }
          }

          if (toDate) {
            const to =
              new Date(
                `${toDate}T23:59:59`,
              );

            if (
              saleDate > to
            ) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      sales,
      search,
      fromDate,
      toDate,
      typeFilter,
    ]);

  const summary =
    useMemo(() => {
      return filteredSales.reduce(
        (total, sale) => {
          total.net +=
            getNumber(
              sale.netAmount,
            );

          total.roundOff +=
            getNumber(
              sale.roundOff,
            );

          total.shortAmount +=
            getNumber(
              sale.shortAmount,
            );

          total.finalPayable +=
            getFinalPayable(sale);

          total.paid +=
            getPaidAmount(sale);

          total.balance +=
            getBalance(sale);

          return total;
        },
        {
          net: 0,
          roundOff: 0,
          shortAmount: 0,
          finalPayable: 0,
          paid: 0,
          balance: 0,
        },
      );
    }, [filteredSales]);

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setTypeFilter("ALL");
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Sales
          </h1>

          <p className="text-sm text-gray-500">
            Sales bill history
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadSales}
            disabled={loading}
            className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            href="/sales/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + New Sale
          </Link>
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

          {/* SEARCH */}

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
              placeholder="Bill No. or customer..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          {/* FROM */}

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

          {/* TO */}

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

          {/* TYPE */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Sale Type
            </label>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | "ALL"
                    | "CASH"
                    | "CREDIT",
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="ALL">
                All Types
              </option>

              <option value="CASH">
                Cash
              </option>

              <option value="CREDIT">
                Credit
              </option>
            </select>
          </div>
        </div>

        {(search ||
          fromDate ||
          toDate ||
          typeFilter !== "ALL") && (
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-gray-500">
              Filters applied
            </span>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* SUMMARY CARDS */}

      {!loading &&
        filteredSales.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">

            <div className="rounded-lg border bg-white p-4">
              <div className="text-xs text-gray-500">
                Bills
              </div>

              <div className="mt-1 text-lg font-semibold">
                {filteredSales.length}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="text-xs text-gray-500">
                Net Amount
              </div>

              <div className="mt-1 text-lg font-semibold">
                ₹{formatAmount(
                  summary.net,
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="text-xs text-gray-500">
                R.OFF
              </div>

              <div className="mt-1 text-lg font-semibold">
                ₹{formatAmount(
                  summary.roundOff,
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="text-xs text-gray-500">
                Short
              </div>

              <div className="mt-1 text-lg font-semibold">
                ₹{formatAmount(
                  summary.shortAmount,
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="text-xs text-gray-500">
                Final Payable
              </div>

              <div className="mt-1 text-lg font-semibold">
                ₹{formatAmount(
                  summary.finalPayable,
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="text-xs text-gray-500">
                Paid
              </div>

              <div className="mt-1 text-lg font-semibold">
                ₹{formatAmount(
                  summary.paid,
                )}
              </div>
            </div>
          </div>
        )}

      {/* TABLE */}

      <div className="overflow-hidden rounded-lg border bg-white">

        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading sales...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-10 text-center">

            <div className="text-sm font-medium text-gray-700">
              No sales found
            </div>

            <div className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </div>

            {(search ||
              fromDate ||
              toDate ||
              typeFilter !== "ALL") && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1300px] text-sm">

              <thead className="border-b bg-gray-50">
                <tr>

                  <th className="px-4 py-3 text-left font-medium">
                    Bill No
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Warehouse
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Net
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    R.OFF
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Short
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Payable
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Paid
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Balance
                  </th>

                  <th className="px-4 py-3 text-center font-medium">
                    Type
                  </th>

                  <th className="px-4 py-3 text-center font-medium">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredSales.map(
                  (sale) => {
                    const paid =
                      getPaidAmount(
                        sale,
                      );

                    const balance =
                      getBalance(
                        sale,
                      );

                    const payable =
                      getFinalPayable(
                        sale,
                      );

                    return (
                      <tr
                        key={sale.id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >

                        {/* BILL */}

                        <td className="px-4 py-3">
                          <Link
                            href={`/sales/view/${sale.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {sale.billNo}
                          </Link>
                        </td>

                        {/* DATE */}

                        <td className="px-4 py-3">
                          {formatDate(
                            sale.billDate,
                          )}
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {sale.customer
                              ?.name ??
                              "Cash Customer"}
                          </div>
                        </td>

                        {/* WAREHOUSE */}

                        <td className="px-4 py-3">
                          {sale.warehouse
                            ?.name ??
                            "-"}
                        </td>

                        {/* NET */}

                        <td className="px-4 py-3 text-right">
                          ₹{formatAmount(
                            sale.netAmount,
                          )}
                        </td>

                        {/* R.OFF */}

                        <td className="px-4 py-3 text-right">
                          ₹{formatAmount(
                            sale.roundOff,
                          )}
                        </td>

                        {/* SHORT */}

                        <td className="px-4 py-3 text-right">
                          ₹{formatAmount(
                            sale.shortAmount,
                          )}
                        </td>

                        {/* PAYABLE */}

                        <td className="px-4 py-3 text-right font-semibold">
                          ₹{formatAmount(
                            payable,
                          )}
                        </td>

                        {/* PAID */}

                        <td className="px-4 py-3 text-right">
                          ₹{formatAmount(
                            paid,
                          )}
                        </td>

                        {/* BALANCE */}

                        <td className="px-4 py-3 text-right">
                          {balance > 0.01 ? (
                            <span className="font-medium text-red-600">
                              ₹{formatAmount(
                                balance,
                              )}
                            </span>
                          ) : (
                            <span className="font-medium text-green-600">
                              ₹0.00
                            </span>
                          )}
                        </td>

                        {/* TYPE */}

                        <td className="px-4 py-3 text-center">

                          {sale.isCredit ? (
                            <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                              CREDIT
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                              CASH
                            </span>
                          )}

                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-3 text-center">

                          <div className="flex items-center justify-center gap-2">

                            <Link
                              href={`/sales/view/${sale.id}`}
                              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                            >
                              View
                            </Link>

                            <Link
                              href={`/sales/edit/${sale.id}`}
                              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Edit
                            </Link>

                          </div>

                        </td>

                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}

      {!loading && (
        <div className="flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">

          <span>
            Showing{" "}
            <strong className="text-gray-700">
              {filteredSales.length}
            </strong>{" "}
            of{" "}
            <strong className="text-gray-700">
              {sales.length}
            </strong>{" "}
            records
          </span>

          {summary.balance >
            0.01 && (
            <span className="font-medium text-red-600">
              Total Outstanding: ₹
              {formatAmount(
                summary.balance,
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}