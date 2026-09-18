"use client";

import { createPortal } from "react-dom";

import { SalesResponse } from "../types/sales.types";
import { CompanyProfile } from "@/features/settings/types/company.types";

import {
  formatCurrency,
  formatDate,
} from "@/shared/utils/format";

interface Props {
  sale: SalesResponse;
  company: CompanyProfile | null;
}

function money(
  value: number | string | undefined | null,
) {
  return `Rs. ${formatCurrency(Number(value ?? 0))}`;
}

/*
 * A 3-inch (80mm) thermal-receipt formatted copy of the sale,
 * rendered via a portal directly onto <body> - a sibling of the
 * entire app shell, not just this page's content - so a single
 * print stylesheet rule (see globals.css) can hide everything else
 * on print regardless of how ERPLayout's own chrome (sidebar, nav,
 * buttons) is structured, without needing to touch that layout at
 * all. Invisible on screen; only ever shown by the browser's print
 * engine.
 */
export default function SalesReceiptPrint({
  sale,
  company,
}: Props) {
  if (typeof document === "undefined") {
    return null;
  }

  const finalPayable = Number(
    sale.finalPayable ?? sale.netAmount ?? 0,
  );

  const totalQty =
    sale.items?.reduce(
      (sum, item) => sum + Number(item.qty ?? 0),
      0,
    ) ?? 0;

  const totalItems = sale.items?.length ?? 0;

  const cgst = Number(sale.cgstAmount ?? 0);
  const sgst = Number(sale.sgstAmount ?? 0);
  const igst = Number(sale.igstAmount ?? 0);

  const itemDiscount = Number(
    sale.itemDiscountAmount ?? 0,
  );

  const billDiscount = Number(
    sale.billDiscountAmount ?? 0,
  );

  const totalPaid =
    sale.payments?.reduce(
      (total, payment) =>
        total +
        Number(payment.amount ?? 0) +
        Number(payment.cardSurcharge ?? 0),
      0,
    ) ?? 0;

  return createPortal(
    <div className="receipt-print-portal">
      <div className="receipt-3in">
        {/* SHOP HEADER */}

        <div className="receipt-center receipt-bold receipt-lg">
          {company?.name || "Your Shop Name"}
        </div>

        {company?.address && (
          <div className="receipt-center">
            {company.address}
          </div>
        )}

        {(company?.phone || company?.email) && (
          <div className="receipt-center">
            {company?.phone
              ? `Ph: ${company.phone}`
              : ""}
            {company?.phone && company?.email
              ? " | "
              : ""}
            {company?.email ?? ""}
          </div>
        )}

        {company?.gstin && (
          <div className="receipt-center">
            GSTIN: {company.gstin}
          </div>
        )}

        <div className="receipt-rule" />

        {/* BILL INFO */}

        <div className="receipt-row">
          <span>Bill No: {sale.billNo}</span>
        </div>

        <div className="receipt-row">
          <span>
            {formatDate(sale.billDate)}
          </span>

          <span>
            {sale.isCredit
              ? "CREDIT"
              : "CASH"}
          </span>
        </div>

        <div className="receipt-row">
          <span>
            {sale.customer?.name ||
              "Cash Customer"}
          </span>
        </div>

        {sale.customer?.gstin && (
          <div className="receipt-row">
            <span>
              GSTIN: {sale.customer.gstin}
            </span>
          </div>
        )}

        <div className="receipt-rule" />

        {/* ITEMS */}

        <div className="receipt-row receipt-bold">
          <span className="receipt-col-item">
            Item
          </span>

          <span className="receipt-col-qty">
            Qty
          </span>

          <span className="receipt-col-rate">
            Rate
          </span>

          <span className="receipt-col-amt">
            Amt
          </span>
        </div>

        <div className="receipt-rule-dashed" />

        {sale.items?.map((item, index) => (
          <div
            key={item.id ?? index}
            className="receipt-item"
          >
            <div>
              {item.item?.name ||
                item.item?.itemCode ||
                "-"}
              {item.batch?.batchNo
                ? ` (${item.batch.batchNo})`
                : ""}
            </div>

            <div className="receipt-row">
              <span className="receipt-col-item">
                {Number(
                  item.gstPercent ?? 0,
                )}
                % GST
              </span>

              <span className="receipt-col-qty">
                {Number(item.qty ?? 0)}
              </span>

              <span className="receipt-col-rate">
                {formatCurrency(
                  Number(item.saleRate ?? 0),
                )}
              </span>

              <span className="receipt-col-amt">
                {formatCurrency(
                  Number(item.netAmount ?? 0),
                )}
              </span>
            </div>
          </div>
        ))}

        <div className="receipt-rule-dashed" />

        <div className="receipt-row">
          <span>
            Items: {totalItems}
          </span>

          <span>Qty: {totalQty}</span>
        </div>

        <div className="receipt-rule" />

        {/* TOTALS */}

        <div className="receipt-row">
          <span>Gross Amount</span>
          <span>
            {money(sale.grossAmount)}
          </span>
        </div>

        {itemDiscount > 0 && (
          <div className="receipt-row">
            <span>Item Discount</span>
            <span>
              -{money(itemDiscount)}
            </span>
          </div>
        )}

        {billDiscount > 0 && (
          <div className="receipt-row">
            <span>Bill Discount</span>
            <span>
              -{money(billDiscount)}
            </span>
          </div>
        )}

        <div className="receipt-row">
          <span>Taxable Amount</span>
          <span>
            {money(sale.taxableAmount)}
          </span>
        </div>

        {cgst > 0 && (
          <div className="receipt-row">
            <span>CGST</span>
            <span>{money(cgst)}</span>
          </div>
        )}

        {sgst > 0 && (
          <div className="receipt-row">
            <span>SGST</span>
            <span>{money(sgst)}</span>
          </div>
        )}

        {igst > 0 && (
          <div className="receipt-row">
            <span>IGST</span>
            <span>{money(igst)}</span>
          </div>
        )}

        {Number(sale.roundOff ?? 0) !== 0 && (
          <div className="receipt-row">
            <span>Round Off</span>
            <span>
              {money(sale.roundOff)}
            </span>
          </div>
        )}

        <div className="receipt-rule" />

        <div className="receipt-row receipt-bold receipt-lg">
          <span>NET PAYABLE</span>
          <span>{money(finalPayable)}</span>
        </div>

        <div className="receipt-rule" />

        {/* PAYMENTS */}

        {!sale.isCredit &&
          sale.payments &&
          sale.payments.length > 0 && (
            <>
              {sale.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="receipt-row"
                >
                  <span>
                    {payment.paymentMode}
                  </span>

                  <span>
                    {money(payment.amount)}
                  </span>
                </div>
              ))}

              <div className="receipt-row receipt-bold">
                <span>Total Paid</span>
                <span>
                  {money(totalPaid)}
                </span>
              </div>

              <div className="receipt-rule" />
            </>
          )}

        {sale.isCredit && (
          <>
            <div className="receipt-center receipt-bold">
              CREDIT SALE
            </div>

            <div className="receipt-rule" />
          </>
        )}

        {/* FOOTER */}

        <div className="receipt-center receipt-bold">
          Thank you! Visit again.
        </div>
      </div>
    </div>,
    document.body,
  );
}
