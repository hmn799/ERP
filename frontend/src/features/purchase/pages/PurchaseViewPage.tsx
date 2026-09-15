"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getPurchaseById,
} from "../services/purchase.service";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

interface PurchaseViewPageProps {
  purchaseId: string;
}

export default function PurchaseViewPage({
  purchaseId,
}: PurchaseViewPageProps) {
  const router = useRouter();

  const [purchase, setPurchase] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const result =
          await getPurchaseById(
            purchaseId,
          );

        setPurchase(result);
      } catch (error) {
        console.error(
          "Failed to load purchase:",
          error,
        );

        alert(
          "Failed to load purchase.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [purchaseId]);

  if (loading) {
    return (
      <div className="p-6">
        Loading purchase...
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-6">
        Purchase not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Purchase Bill
          </h1>

          <p className="text-sm text-muted-foreground">
            {purchase.billNo}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/purchase/edit/${purchase.id}`,
              )
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              router.back()
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
            {purchase.billNo}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Bill Date
          </div>

          <div className="font-medium">
            {formatDate(
              purchase.billDate,
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Invoice No
          </div>

          <div className="font-medium">
            {purchase.invoiceNo ||
              "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Supplier
          </div>

          <div className="font-medium">
            {purchase.supplier?.name ||
              "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Warehouse
          </div>

          <div className="font-medium">
            {purchase.warehouse?.name ||
              "-"}
          </div>
        </div>
      </div>

      {/* ITEMS */}

      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/30 p-4">
          <h2 className="font-semibold">
            Purchase Items
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
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
                  Free
                </th>

                <th className="p-3 text-right">
                  P.Rate
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
              {purchase.items?.map(
                (
                  item: any,
                  index: number,
                ) => (
                  <tr
                    key={
                      item.id ??
                      index
                    }
                    className="border-b"
                  >
                    <td className="p-3">
                      {index + 1}
                    </td>

                    <td className="p-3">
                      <div className="font-medium">
                        {item.item
                          ?.name ||
                          "-"}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {item.item
                          ?.itemCode ||
                          ""}
                      </div>
                    </td>

                    <td className="p-3">
                      {item.batch
                        ?.batchNo ||
                        "-"}
                    </td>

                    <td className="p-3 text-right">
                      {formatInteger(
                        Number(
                          item.qty,
                        ),
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {formatInteger(
                        Number(
                          item.freeQty ??
                            0,
                        ),
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {formatCurrency(
                        Number(
                          item.purchaseRate,
                        ),
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {Number(
                        item.gstPercent ??
                          0,
                      ).toFixed(2)}
                      %
                    </td>

                    <td className="p-3 text-right font-medium">
                      {formatCurrency(
                        Number(
                          item.netAmount ??
                            0,
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

      {/* TOTALS */}

      <div className="flex justify-end">
        <div className="w-full max-w-md space-y-2 rounded-lg border p-5">
          <div className="flex justify-between">
            <span>
              Gross Amount
            </span>

            <span>
              {formatCurrency(
                Number(
                  purchase.grossAmount ??
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Discount
            </span>

            <span>
              {formatCurrency(
                Number(
                  purchase.discountAmount ??
                    0,
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
                  purchase.taxableAmount ??
                    0,
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
                  purchase.cgstAmount ??
                    0,
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
                  purchase.sgstAmount ??
                    0,
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
                  purchase.igstAmount ??
                    0,
                ),
              )}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>
                Net Amount
              </span>

              <span>
                {formatCurrency(
                  Number(
                    purchase.netAmount ??
                      0,
                  ),
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}