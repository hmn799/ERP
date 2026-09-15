"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  cancelPurchaseReturn,
  getPurchaseReturnById,
} from "../services/purchase-return.service";

import {
  PurchaseReturnResponse,
} from "../types/purchase-return.types";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

interface Props {
  id: string;
}

type PurchaseReturnWithStatus =
  PurchaseReturnResponse & {
    status?: string;
  };

export default function PurchaseReturnViewPage({
  id,
}: Props) {
  const router = useRouter();

  const [
    data,
    setData,
  ] = useState<
    PurchaseReturnWithStatus | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  async function loadReturn() {
    try {
      setLoading(true);

      const result =
        await getPurchaseReturnById(id);

      setData(
        result as PurchaseReturnWithStatus,
      );
    } catch (error) {
      console.error(
        "Failed to load purchase return:",
        error,
      );

      alert(
        "Failed to load purchase return.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReturn();
  }, [id]);

  async function handleCancel() {
    if (!data) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel purchase return ${data.returnNo}?\n\nStock and supplier ledger entries will be reversed.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      await cancelPurchaseReturn(
        data.id,
      );

      alert(
        "Purchase return cancelled successfully.",
      );

      router.push(
        "/purchase-return/list",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to cancel purchase return:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to cancel purchase return.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading purchase return...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-bold">
          Purchase Return Not Found
        </h1>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/purchase-return/list",
            )
          }
          className="rounded border px-4 py-2"
        >
          Back to Returns
        </button>
      </div>
    );
  }

  const items =
    data.items ?? [];

  const isCancelled =
    String(
      data.status ?? "",
    ).toUpperCase() ===
    "CANCELLED";

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-bold">
              Purchase Return
            </h1>

            {isCancelled && (
              <span className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                CANCELLED
              </span>
            )}

          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.returnNo}
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/purchase-return/list",
              )
            }
            className="rounded border px-4 py-2 text-sm"
          >
            Back to Returns
          </button>

          {!isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel Return"}
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
            Purchase Bill
          </div>

          <div className="font-medium">
            {data.purchaseBill
              ?.billNo ?? "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Supplier
          </div>

          <div className="font-medium">
            {data.supplier
              ?.name ?? "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Warehouse
          </div>

          <div className="font-medium">
            {data.warehouse
              ?.name ?? "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Invoice No
          </div>

          <div className="font-medium">
            {data.purchaseBill
              ?.invoiceNo ?? "-"}
          </div>
        </div>

        {data.status && (
          <div>
            <div className="text-xs text-muted-foreground">
              Status
            </div>

            <div
              className={
                isCancelled
                  ? "font-medium text-red-600"
                  : "font-medium text-green-600"
              }
            >
              {data.status}
            </div>
          </div>
        )}

      </div>

      {/* =====================================================
          ITEMS
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
                  Purchase Rate
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
                        {item.item
                          ?.itemCode ?? "-"}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {item.item
                          ?.name ?? "-"}
                      </div>

                    </td>

                    <td className="px-4 py-3">
                      {item.batch
                        ?.batchNo ?? "-"}
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
                          item.purchaseRate,
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
          TOTALS
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

          <div className="flex justify-between border-t pt-3 font-bold">
            <span>
              Net Amount
            </span>

            <span>
              {formatCurrency(
                Number(
                  data.netAmount,
                ),
              )}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}