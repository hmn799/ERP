"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSaleReturnById,
} from "../services/sale-return.service";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

interface Props {
  id: string;
}

/*
 * =====================================================
 * LOCAL VIEW TYPES
 * =====================================================
 *
 * The API already returns item and batch information.
 * These local types allow the view to display that
 * information without changing the existing service
 * contract yet.
 * =====================================================
 */

type SaleReturnViewItem = {
  id: string;

  itemId: string;
  batchId: string;

  qty: number | string;

  saleRate: number | string;

  gstPercent: number | string;

  taxableAmount: number | string;

  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;

  netAmount: number | string;

  item?: {
    itemCode?: string;
    name?: string;
    hsnCode?: string | null;
  };

  batch?: {
    batchNo?: string;
    purchaseRate?: number | string;
    retailRate?: number | string;
    wholesaleRate?: number | string;
    distributorRate?: number | string;
    mrp?: number | string;
  };
};

type SaleReturnViewPayment = {
  id: string;

  paymentMode: string;

  amount: number | string;

  cardSurcharge?: number | string;

  transactionNo?: string | null;

  remarks?: string | null;
};

type SaleReturnViewData = {
  id: string;

  returnNo: string;

  returnDate: string;

  salesBillId?: string | null;

  customerId?: string | null;

  warehouseId: string;

  grossAmount: number | string;

  taxableAmount: number | string;

  cgstAmount: number | string;

  sgstAmount: number | string;

  igstAmount: number | string;

  netAmount: number | string;

  customer?: {
    customerCode?: string;
    name?: string;
    gstin?: string | null;
  };

  warehouse?: {
    name?: string;
  };

  salesBill?: {
    billNo?: string;
    billDate?: string;
  };

  items: SaleReturnViewItem[];

  payments?: SaleReturnViewPayment[];
};

export default function SaleReturnViewPage({
  id,
}: Props) {
  const router = useRouter();

  const [
    data,
    setData,
  ] = useState<SaleReturnViewData | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  async function loadReturn() {
    try {
      setLoading(true);
      setError(null);

      const result =
        await getSaleReturnById(id);

      setData(
        result as unknown as SaleReturnViewData,
      );
    } catch (err) {
      console.error(
        "Failed to load sales return:",
        err,
      );

      setError(
        "Failed to load sales return.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadReturn();
    }
  }, [id]);

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
        <h1 className="text-xl font-bold">
          Sales Return
        </h1>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/sales/returns",
            )
          }
          className="rounded border px-4 py-2 text-sm"
        >
          Back to Sales Returns
        </button>
      </div>
    );
  }

  /*
   * =====================================================
   * NOT FOUND
   * =====================================================
   */

  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-bold">
          Sales Return Not Found
        </h1>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/sales/returns",
            )
          }
          className="rounded border px-4 py-2 text-sm"
        >
          Back to Sales Returns
        </button>
      </div>
    );
  }

  const items =
    data.items ?? [];

  const payments =
    data.payments ?? [];

  /*
   * =====================================================
   * TOTAL REFUND PAID
   * =====================================================
   */

  const totalRefundPaid =
    payments.reduce(
      (
        total,
        payment,
      ) =>
        total +
        Number(
          payment.amount ?? 0,
        ) +
        Number(
          payment.cardSurcharge ?? 0,
        ),
      0,
    );

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Sales Return
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.returnNo}
          </p>

        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/sales/returns",
              )
            }
            className="rounded border px-4 py-2 text-sm hover:bg-muted"
          >
            Back to Returns
          </button>

          {data.salesBillId && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/sales/view/${data.salesBillId}`,
                )
              }
              className="rounded border px-4 py-2 text-sm hover:bg-muted"
            >
              View Sales Bill
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          BASIC INFORMATION
      ===================================================== */}

      <div className="grid gap-4 rounded-lg border p-5 md:grid-cols-4">

        <div>
          <div className="text-xs text-muted-foreground">
            Return No
          </div>

          <div className="font-medium">
            {data.returnNo}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Return Date
          </div>

          <div className="font-medium">
            {formatDate(
              data.returnDate,
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Sales Bill
          </div>

          <div className="font-medium">
            {data.salesBill
              ?.billNo ??
              "Direct Return (no bill)"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Customer
          </div>

          <div className="font-medium">
            {data.customer
              ?.name ??
              "CASH CUSTOMER"}
          </div>

          {data.customer
            ?.customerCode && (
            <div className="text-xs text-muted-foreground">
              {
                data.customer
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
            {data.warehouse
              ?.name ??
              "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            GSTIN
          </div>

          <div className="font-medium">
            {data.customer
              ?.gstin ||
              "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Original Bill Date
          </div>

          <div className="font-medium">
            {data.salesBill
              ?.billDate
              ? formatDate(
                  data.salesBill
                    .billDate,
                )
              : "-"}
          </div>
        </div>

      </div>

      {/* =====================================================
          RETURNED ITEMS
      ===================================================== */}

      <div className="overflow-hidden rounded-lg border">

        <div className="border-b px-5 py-4">

          <h2 className="font-semibold">
            Returned Items
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b bg-muted/40">

              <tr>

                <th className="px-4 py-3 text-left">
                  Item
                </th>

                <th className="px-4 py-3 text-left">
                  Batch
                </th>

                <th className="px-4 py-3 text-right">
                  Qty
                </th>

                <th className="px-4 py-3 text-right">
                  Sale Rate
                </th>

                <th className="px-4 py-3 text-right">
                  GST
                </th>

                <th className="px-4 py-3 text-right">
                  Taxable
                </th>

                <th className="px-4 py-3 text-right">
                  Net Amount
                </th>

              </tr>

            </thead>

            <tbody>

              {items.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0"
                  >

                    <td className="px-4 py-3">

                      <div className="font-medium">
                        {
                          item.item
                            ?.itemCode ??
                          "-"
                        }
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {
                          item.item
                            ?.name ??
                          "-"
                        }
                      </div>

                    </td>

                    <td className="px-4 py-3">
                      {
                        item.batch
                          ?.batchNo ??
                        "-"
                      }
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatInteger(
                        Number(
                          item.qty,
                        ),
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatCurrency(
                        Number(
                          item.saleRate,
                        ),
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {Number(
                        item.gstPercent,
                      ).toFixed(2)}
                      %
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatCurrency(
                        Number(
                          item.taxableAmount,
                        ),
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(
                        Number(
                          item.netAmount,
                        ),
                      )}
                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          TOTALS + REFUND
      ===================================================== */}

      <div className="flex justify-end">

        <div className="w-full max-w-sm space-y-3 rounded-lg border p-5">

          <div className="flex justify-between">
            <span>
              Gross Amount
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.grossAmount,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Taxable Amount
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.taxableAmount,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              CGST
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.cgstAmount,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              SGST
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.sgstAmount,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              IGST
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.igstAmount,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 font-bold">
            <span>
              Return Amount
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.netAmount,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Refund Paid
            </span>

            <span>
              {formatCurrency(
                totalRefundPaid,
              )}
            </span>
          </div>

        </div>

      </div>

      {/* =====================================================
          REFUND PAYMENTS
      ===================================================== */}

      {payments.length > 0 && (
        <div className="overflow-hidden rounded-lg border">

          <div className="border-b px-5 py-4">

            <h2 className="font-semibold">
              Refund Payments
            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="border-b bg-muted/40">

                <tr>

                  <th className="px-4 py-3 text-left">
                    Payment Mode
                  </th>

                  <th className="px-4 py-3 text-right">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-left">
                    Transaction No
                  </th>

                  <th className="px-4 py-3 text-left">
                    Remarks
                  </th>

                </tr>

              </thead>

              <tbody>

                {payments.map(
                  (payment) => (
                    <tr
                      key={
                        payment.id
                      }
                      className="border-b last:border-b-0"
                    >

                      <td className="px-4 py-3 font-medium">
                        {
                          payment.paymentMode
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(
                          Number(
                            payment.amount,
                          ),
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {
                          payment.transactionNo ??
                          "-"
                        }
                      </td>

                      <td className="px-4 py-3">
                        {
                          payment.remarks ??
                          "-"
                        }
                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
}