"use client";

import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import type {
  Payment,
  Receipt,
} from "../types/ledger.types";

import { CompanyProfile } from "@/features/settings/types/company.types";

import {
  formatCurrency,
  formatDate,
  formatTime,
} from "@/shared/utils/format";

interface Props {
  type: "PAYMENT" | "RECEIPT";
  record: Payment | Receipt;
  bankAccountName?: string | null;
  outstandingBalance?: number | null;
  company: CompanyProfile | null;
}

function money(value: number | string | undefined | null) {
  return `Rs. ${formatCurrency(Number(value ?? 0))}`;
}

/*
 * Same 3-inch (80mm) print approach as SalesReceiptPrint - a portal
 * onto <body> plus the shared .receipt-* print CSS in globals.css -
 * reused here for Payment/Receipt vouchers since neither has a
 * dedicated view page of its own to attach a printable layout to.
 */
export default function VoucherReceiptPrint({
  type,
  record,
  bankAccountName,
  outstandingBalance,
  company,
}: Props) {
  if (typeof document === "undefined") {
    return null;
  }

  const isPayment = type === "PAYMENT";

  const partyLabel = isPayment
    ? "Paid To"
    : "Received From";

  const partyCode = isPayment
    ? (record as Payment).supplierCode
    : (record as Receipt).customerCode;

  const partyName = isPayment
    ? (record as Payment).supplierName
    : (record as Receipt).customerName;

  const voucherNo = `${isPayment ? "PV" : "RV"}-${record.id
    .slice(-8)
    .toUpperCase()}`;

  const receiptStyle = {
    "--receipt-font-size": `${company?.receiptFontSize ?? 13}px`,
  } as CSSProperties;

  return createPortal(
    <div className="receipt-print-portal">
      <div
        className="receipt-3in"
        style={receiptStyle}
      >
        {/* SHOP HEADER */}

        <div className="receipt-center receipt-bold receipt-lg receipt-shop-name">
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

        <div className="receipt-center receipt-bold receipt-lg">
          {isPayment
            ? "PAYMENT VOUCHER"
            : "RECEIPT VOUCHER"}
        </div>

        <div className="receipt-rule" />

        {/* VOUCHER INFO */}

        <div className="receipt-row">
          <span>Voucher No: {voucherNo}</span>
        </div>

        <div className="receipt-row">
          <span>
            {formatDate(record.date)}{" "}
            {formatTime(record.date)}
          </span>
        </div>

        <div className="receipt-rule-dashed" />

        <div className="receipt-row">
          <span>{partyLabel}</span>
        </div>

        <div className="receipt-row receipt-bold receipt-lg">
          <span>{partyName}</span>
        </div>

        <div className="receipt-row">
          <span>Code: {partyCode}</span>
        </div>

        <div className="receipt-row">
          <span>
            Against Bill:{" "}
            {record.billNo || "General"}
          </span>
        </div>

        <div className="receipt-rule-dashed" />

        <div className="receipt-row">
          <span>Mode</span>
          <span>
            {bankAccountName
              ? bankAccountName
              : "Cash"}
          </span>
        </div>

        {record.remarks && (
          <div className="receipt-row">
            <span>
              Remarks: {record.remarks}
            </span>
          </div>
        )}

        <div className="receipt-rule" />

        <div className="receipt-row receipt-bold receipt-lg">
          <span>AMOUNT</span>
          <span>{money(record.amount)}</span>
        </div>

        {outstandingBalance !== null &&
          outstandingBalance !== undefined && (
            <div className="receipt-row receipt-bold">
              <span>
                {isPayment
                  ? "Balance Payable"
                  : "Balance Receivable"}
              </span>

              <span>
                {money(
                  outstandingBalance > 0
                    ? outstandingBalance
                    : 0,
                )}
              </span>
            </div>
          )}

        <div className="receipt-rule" />

        <div className="receipt-center receipt-bold">
          {isPayment
            ? "Thank you!"
            : "Thank you for your payment!"}
        </div>

        <div className="receipt-center receipt-flourish">
          * * * * * * * * * *
        </div>
      </div>
    </div>,
    document.body,
  );
}
