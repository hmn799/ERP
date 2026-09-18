"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSaleById } from "../services/sales.service";
import { SalesResponse } from "../types/sales.types";
import SalesReceiptPrint from "../components/SalesReceiptPrint";

import CompanyService from "@/services/company/company.service";
import { CompanyProfile } from "@/features/settings/types/company.types";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

interface SalesViewPageProps {
  saleId: string;
}

export default function SalesViewPage({
  saleId,
}: SalesViewPageProps) {
  const router = useRouter();

  const [sale, setSale] =
    useState<SalesResponse | null>(null);

  const [company, setCompany] =
    useState<CompanyProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadSale() {
      try {
        setLoading(true);
        setError(null);

        const result =
          await getSaleById(saleId);

        setSale(result);
      } catch (err) {
        console.error(
          "Failed to load sale:",
          err,
        );

        setError(
          "Failed to load sales bill.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (saleId) {
      loadSale();
    }
  }, [saleId]);

  useEffect(() => {
    CompanyService.getProfile()
      .then(setCompany)
      .catch((err) =>
        console.error(
          "Failed to load company profile:",
          err,
        ),
      );
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading sales bill...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/sales/list")
          }
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-lg border p-4">
          Sales bill not found.
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/sales/list")
          }
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  const totalPaid =
    sale.payments?.reduce(
      (total, payment) =>
        total +
        Number(payment.amount ?? 0) +
        Number(
          payment.cardSurcharge ?? 0,
        ),
      0,
    ) ?? 0;

  const finalPayable = Number(
    sale.finalPayable ??
      sale.netAmount ??
      0,
  );

  return (
    <div className="space-y-6 p-6">
      <SalesReceiptPrint
        sale={sale}
        company={company}
      />

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Sales Bill
          </h1>

          <p className="text-sm text-muted-foreground">
            {sale.billNo}
          </p>
        </div>

        <div className="flex gap-2">
  <button
    type="button"
    onClick={() =>
      window.print()
    }
    className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
  >
    Print
  </button>

  <button
    type="button"
    onClick={() =>
      router.push(
        `/sales/returns/new?billId=${sale.id}`,
      )
    }
    className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
  >
    Return Sale
  </button>

  <button
    type="button"
    onClick={() =>
      router.push("/sales/list")
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
            {formatDate(sale.billDate)}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Customer
          </div>

          <div className="font-medium">
            {sale.customer?.name ||
              "CASH CUSTOMER"}
          </div>

          {sale.customer?.customerCode && (
            <div className="text-xs text-muted-foreground">
              {sale.customer.customerCode}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Warehouse
          </div>

          <div className="font-medium">
            {sale.warehouse?.name || "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Sale Type
          </div>

          <div className="font-medium">
            {sale.isCredit
              ? "Credit Sale"
              : "Cash Sale"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            GSTIN
          </div>

          <div className="font-medium">
            {sale.customer?.gstin || "-"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">
            Salesman
          </div>

          <div className="font-medium">
            {sale.salesman?.name || "-"}
          </div>
        </div>
      </div>

      {/* ITEMS */}

      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/30 p-4">
          <h2 className="font-semibold">
            Sales Items
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
                  Rate
                </th>

                <th className="p-3 text-right">
                  Discount
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
              {sale.items?.map(
                (item, index) => (
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
                        {item.item?.name ||
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
                      {formatCurrency(
                        Number(
                          item.saleRate,
                        ),
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {Number(
                        item.discountPercent ??
                          0,
                      ).toFixed(2)}
                      %
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

      {/* BILL SUMMARY */}

      <div className="flex justify-end">
        <div className="w-full max-w-md space-y-2 rounded-lg border p-5">

          <div className="mb-3 border-b pb-3">
            <h2 className="font-semibold">
              Bill Summary
            </h2>
          </div>

          <div className="flex justify-between">
            <span>
              Gross Amount
            </span>

            <span>
              {formatCurrency(
                Number(
                  sale.grossAmount ?? 0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Item Discount
            </span>

            <span>
              {formatCurrency(
                Number(
                  sale.itemDiscountAmount ??
                    0,
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Bill Discount
            </span>

            <span>
              {formatCurrency(
                Number(
                  sale.billDiscountAmount ??
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
                  sale.taxableAmount ?? 0,
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
                  sale.cgstAmount ?? 0,
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
                  sale.sgstAmount ?? 0,
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
                  sale.igstAmount ?? 0,
                ),
              )}
            </span>
          </div>

          {/* NET / ROUND OFF / SHORT */}

          <div className="mt-3 border-t pt-3">

            <div className="flex justify-between">
              <span>
                Net Amount
              </span>

              <span>
                {formatCurrency(
                  Number(
                    sale.netAmount ?? 0,
                  ),
                )}
              </span>
            </div>

            <div className="mt-2 flex justify-between">
              <span>
                R.OFF
              </span>

              <span>
                {formatCurrency(
                  Number(
                    sale.roundOff ?? 0,
                  ),
                )}
              </span>
            </div>

            <div className="mt-2 flex justify-between">
              <span>
                Short Amount
              </span>

              <span>
                {formatCurrency(
                  Number(
                    sale.shortAmount ?? 0,
                  ),
                )}
              </span>
            </div>
          </div>

          {/* FINAL PAYABLE */}

          <div className="mt-3 border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>
                Final Payable
              </span>

              <span>
                {formatCurrency(
                  finalPayable,
                )}
              </span>
            </div>
          </div>

          {/* PAYMENTS */}

          {!sale.isCredit &&
            sale.payments &&
            sale.payments.length > 0 && (
              <div className="mt-5 border-t pt-4">

                <h3 className="mb-3 font-semibold">
                  Payments
                </h3>

                <div className="space-y-2">
                  {sale.payments.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        className="rounded-md border bg-muted/20 p-3"
                      >
                        <div className="flex justify-between font-medium">
                          <span>
                            {payment.paymentMode}
                          </span>

                          <span>
                            {formatCurrency(
                              Number(
                                payment.amount ??
                                  0,
                              ),
                            )}
                          </span>
                        </div>

                        {Number(
                          payment.cardSurcharge ??
                            0,
                        ) > 0 && (
                          <div className="mt-1 flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Card Surcharge
                            </span>

                            <span>
                              {formatCurrency(
                                Number(
                                  payment.cardSurcharge ??
                                    0,
                                ),
                              )}
                            </span>
                          </div>
                        )}

                        {payment.transactionNo && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Transaction:{" "}
                            {payment.transactionNo}
                          </div>
                        )}

                        {payment.remarks && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {payment.remarks}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
                  <span>
                    Total Paid
                  </span>

                  <span>
                    {formatCurrency(
                      totalPaid,
                    )}
                  </span>
                </div>
              </div>
            )}

          {/* CREDIT SALE */}

          {sale.isCredit && (
            <div className="mt-5 rounded-md border bg-muted/20 p-3">
              <div className="font-medium">
                CREDIT SALE
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                Amount Outstanding:{" "}
                {formatCurrency(
                  finalPayable,
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}