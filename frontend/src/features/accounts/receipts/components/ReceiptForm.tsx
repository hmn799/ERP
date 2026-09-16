"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";

import CustomerService from "@/services/customer/customer.service";
import LedgerService from "@/services/ledger/ledger.service";
import BankAccountService from "@/services/bank/bank-account.service";

import type { CreateReceiptDto } from "../../types/ledger.types";

export type ReceiptFormValues = CreateReceiptDto;

interface ReceiptFormProps {
  loading?: boolean;
  onSubmit(values: ReceiptFormValues): void;
}

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReceiptForm({
  loading,
  onSubmit,
}: ReceiptFormProps) {
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: CustomerService.getAll,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
    retry: false,
  });

  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [remarks, setRemarks] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  const [outstanding, setOutstanding] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!customerId) {
      setOutstanding(null);
      return;
    }

    let cancelled = false;

    LedgerService.getCustomerOutstanding(customerId)
      .then((value) => {
        if (!cancelled) setOutstanding(value);
      })
      .catch(() => {
        if (!cancelled) setOutstanding(null);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <form
      id="receipt-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          customerId,
          amount: Number(amount),
          receiptDate: new Date(
            receiptDate,
          ).toISOString(),
          remarks: remarks || undefined,
          bankAccountId: bankAccountId || undefined,
        });
      }}
    >
      <select
        value={customerId}
        disabled={loading}
        onChange={(e) =>
          setCustomerId(e.target.value)
        }
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">
          Select customer...
        </option>

        {customers.map((customer) => (
          <option
            key={customer.id}
            value={customer.id}
          >
            {customer.customerCode} -{" "}
            {customer.name}
          </option>
        ))}
      </select>

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
        placeholder="Amount received"
        onChange={(e) => setAmount(e.target.value)}
      />

      <Input
        type="date"
        value={receiptDate}
        disabled={loading}
        onChange={(e) =>
          setReceiptDate(e.target.value)
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
            Cash (not deposited to a bank account)
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
