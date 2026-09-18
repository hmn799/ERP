"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";

import SupplierService from "@/services/supplier/supplier.service";
import LedgerService from "@/services/ledger/ledger.service";
import BankAccountService from "@/services/bank/bank-account.service";

import { getPurchaseList } from "@/features/purchase/services/purchase.service";

import type { CreatePaymentDto } from "../../types/ledger.types";

export type PaymentFormValues = CreatePaymentDto;

interface PaymentFormProps {
  loading?: boolean;
  onSubmit(values: PaymentFormValues): void;
}

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PaymentForm({
  loading,
  onSubmit,
}: PaymentFormProps) {
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: SupplierService.getAll,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
    retry: false,
  });

  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [remarks, setRemarks] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [purchaseBillId, setPurchaseBillId] =
    useState("");

  const [outstanding, setOutstanding] = useState<
    number | null
  >(null);

  const [supplierBills, setSupplierBills] = useState<
    { id: string; billNo: string; billDate: string; totalAmount: number }[]
  >([]);

  useEffect(() => {
    if (!supplierId) {
      setOutstanding(null);
      return;
    }

    let cancelled = false;

    LedgerService.getSupplierOutstanding(supplierId)
      .then((value) => {
        if (!cancelled) setOutstanding(value);
      })
      .catch(() => {
        if (!cancelled) setOutstanding(null);
      });

    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  useEffect(() => {
    if (!supplierId) {
      setSupplierBills([]);
      return;
    }

    let cancelled = false;

    getPurchaseList({ supplierId, pageSize: 100 })
      .then((response) => {
        if (!cancelled) {
          setSupplierBills(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) setSupplierBills([]);
      });

    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  return (
    <form
      id="payment-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          supplierId,
          amount: Number(amount),
          paymentDate: new Date(
            paymentDate,
          ).toISOString(),
          remarks: remarks || undefined,
          bankAccountId: bankAccountId || undefined,
          purchaseBillId: purchaseBillId || undefined,
        });
      }}
    >
      <select
        value={supplierId}
        disabled={loading}
        onChange={(e) => {
          setSupplierId(e.target.value);
          setPurchaseBillId("");
        }}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">
          Select supplier...
        </option>

        {suppliers.map((supplier) => (
          <option
            key={supplier.id}
            value={supplier.id}
          >
            {supplier.supplierCode} -{" "}
            {supplier.name}
          </option>
        ))}
      </select>

      {supplierId && supplierBills.length > 0 && (
        <select
          value={purchaseBillId}
          disabled={loading}
          onChange={(e) =>
            setPurchaseBillId(e.target.value)
          }
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">
            General payment (not against a specific bill)
          </option>

          {supplierBills.map((bill) => (
            <option key={bill.id} value={bill.id}>
              {bill.billNo} - ₹
              {money(bill.totalAmount)} (
              {new Date(
                bill.billDate,
              ).toLocaleDateString("en-IN")}
              )
            </option>
          ))}
        </select>
      )}

      {outstanding !== null && (
        <div className="rounded-md border bg-gray-50 p-2 text-sm">
          Current outstanding:{" "}
          <span className="font-semibold">
            ₹{money(outstanding)}
          </span>
        </div>
      )}

      <Input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        disabled={loading}
        placeholder="Amount paid"
        onChange={(e) => setAmount(e.target.value)}
      />

      <Input
        type="date"
        value={paymentDate}
        disabled={loading}
        onChange={(e) =>
          setPaymentDate(e.target.value)
        }
      />

      <Input
        value={remarks}
        disabled={loading}
        placeholder="Remarks (optional)"
        onChange={(e) => setRemarks(e.target.value)}
      />

      {bankAccounts.length > 0 && (
        <select
          value={bankAccountId}
          disabled={loading}
          onChange={(e) =>
            setBankAccountId(e.target.value)
          }
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">
            Cash (not paid from a bank account)
          </option>

          {bankAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} - {account.bankName}
            </option>
          ))}
        </select>
      )}
    </form>
  );
}
