"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  getSaleReturns,
  SaleReturnResponse,
} from "../services/sale-return.service";

export default function SaleReturnListPage() {
  const [returns, setReturns] =
    useState<SaleReturnResponse[]>([]);

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

  /*
   * =====================================================
   * LOAD SALES RETURNS
   * =====================================================
   */

  async function loadReturns() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getSaleReturns();

      setReturns(data);
    } catch (err) {
      console.error(
        "Failed to load sales returns:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load sales returns.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReturns();
  }, []);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  function getNumber(
    value:
      | number
      | string
      | null
      | undefined,
  ) {
    const result =
      Number(value ?? 0);

    return Number.isFinite(result)
      ? result
      : 0;
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
    value: string,
  ) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
    );
  }

  /*
   * =====================================================
   * FILTERED RETURNS
   * =====================================================
   */

  const filteredReturns =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return returns.filter(
        (item) => {
          /*
           * SEARCH
           */

          if (searchText) {
            const returnNo =
              item.returnNo
                ?.toLowerCase() ??
              "";

            const salesBill =
              item.salesBill
                ?.billNo
                ?.toLowerCase() ??
              "";

            const customer =
              item.customer
                ?.name
                ?.toLowerCase() ??
              "";

            if (
              !returnNo.includes(
                searchText,
              ) &&
              !salesBill.includes(
                searchText,
              ) &&
              !customer.includes(
                searchText,
              )
            ) {
              return false;
            }
          }

          /*
           * FROM DATE
           */

          const returnDate =
            new Date(
              item.returnDate,
            );

          if (fromDate) {
            const from =
              new Date(
                `${fromDate}T00:00:00`,
              );

            if (
              returnDate < from
            ) {
              return false;
            }
          }

          /*
           * TO DATE
           */

          if (toDate) {
            const to =
              new Date(
                `${toDate}T23:59:59`,
              );

            if (
              returnDate > to
            ) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      returns,
      search,
      fromDate,
      toDate,
    ]);

  /*
   * =====================================================
   * SUMMARY
   * =====================================================
   */

  const summary =
    useMemo(() => {
      return filteredReturns.reduce(
        (total, item) => {
          total.count += 1;

          total.amount +=
            getNumber(
              item.netAmount,
            );

          return total;
        },
        {
          count: 0,
          amount: 0,
        },
      );
    }, [
      filteredReturns,
    ]);

  /*
   * =====================================================
   * CLEAR FILTERS
   * =====================================================
   */

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
  }

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Sales Returns
          </h1>

          <p className="text-sm text-gray-500">
            Sales return history
          </p>
        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={loadReturns}
            disabled={loading}
            className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            href="/sales/list"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            + Return Against a Bill
          </Link>

          <Link
            href="/sales/returns/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Direct Return (No Bill)
          </Link>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

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
              placeholder="Return No., Sales Bill or customer..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-black"
            />

          </div>

          {/* FROM DATE */}

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

          {/* TO DATE */}

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

          {/* CLEAR */}

          <div className="flex items-end">

            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Clear Filters
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <div className="rounded-lg border bg-white p-4">

          <div className="text-xs text-gray-500">
            Returns
          </div>

          <div className="mt-1 text-xl font-semibold">
            {summary.count}
          </div>

        </div>

        <div className="rounded-lg border bg-white p-4">

          <div className="text-xs text-gray-500">
            Total Return Amount
          </div>

          <div className="mt-1 text-xl font-semibold">
            {"\u20B9"}
            {formatAmount(
              summary.amount,
            )}
          </div>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-lg border bg-white">

        <div className="border-b px-5 py-4">

          <h2 className="font-semibold">
            Sales Return History
          </h2>

        </div>

        {loading ? (

          <div className="p-8 text-center text-sm text-gray-500">
            Loading sales returns...
          </div>

        ) : filteredReturns.length === 0 ? (

          <div className="p-8 text-center">

            <div className="text-sm font-medium">
              No sales returns found
            </div>

            <div className="mt-1 text-sm text-gray-500">
              Try changing your search or date filters.
            </div>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="border-b bg-muted/40">

                <tr>

                  <th className="px-4 py-3 text-left">
                    Return No
                  </th>

                  <th className="px-4 py-3 text-left">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left">
                    Sales Bill
                  </th>

                  <th className="px-4 py-3 text-left">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left">
                    Warehouse
                  </th>

                  <th className="px-4 py-3 text-right">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-right">
                    Refund
                  </th>

                  <th className="px-4 py-3 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredReturns.map(
                  (item) => {

                    const refundAmount =
                      item.payments?.reduce(
                        (
                          total,
                          payment,
                        ) =>
                          total +
                          getNumber(
                            payment.amount,
                          ),
                        0,
                      ) ?? 0;

                    const refundModes =
                      Array.from(
                        new Set(
                          item.payments?.map(
                            (
                              payment,
                            ) =>
                              payment.paymentMode,
                          ) ?? [],
                        ),
                      );

                    return (
                      <tr
                        key={item.id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >

                        {/* RETURN NO */}

                        <td className="px-4 py-3 font-medium">
                          {item.returnNo}
                        </td>

                        {/* DATE */}

                        <td className="px-4 py-3">
                          {formatDate(
                            item.returnDate,
                          )}
                        </td>

                        {/* SALES BILL */}

                        <td className="px-4 py-3">
                          {item.salesBill
                            ?.billNo ??
                            "-"}
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-4 py-3">
                          {item.customer
                            ?.name ??
                            "CASH CUSTOMER"}
                        </td>

                        {/* WAREHOUSE */}

                        <td className="px-4 py-3">
                          {item.warehouse
                            ?.name ??
                            "-"}
                        </td>

                        {/* AMOUNT */}

                        <td className="px-4 py-3 text-right font-medium">
                          {"\u20B9"}
                          {formatAmount(
                            item.netAmount,
                          )}
                        </td>

                        {/* REFUND */}

                        <td className="px-4 py-3 text-right">

                          <div>
                            {"\u20B9"}
                            {formatAmount(
                              refundAmount,
                            )}
                          </div>

                          <div className="text-xs text-gray-500">
                            {refundModes.length
                              ? refundModes.join(
                                  " + ",
                                )
                              : "-"}
                          </div>

                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-3 text-right">

                          <Link
                            href={`/sales/returns/view/${item.id}`}
                            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                          >
                            View
                          </Link>

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

    </div>
  );
}

