"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";
import { Button } from "@/components/ui/button";

import CustomerService from "@/services/customer/customer.service";
import SupplierService from "@/services/supplier/supplier.service";
import LedgerService from "@/services/ledger/ledger.service";

import type { LedgerRow } from "../../types/ledger.types";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const columns: ColumnDef<LedgerRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Date(
        row.original.date,
      ).toLocaleDateString("en-IN"),
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "debit",
    header: "Debit",
    cell: ({ row }) =>
      row.original.debit
        ? `₹${money(row.original.debit)}`
        : "-",
  },
  {
    accessorKey: "credit",
    header: "Credit",
    cell: ({ row }) =>
      row.original.credit
        ? `₹${money(row.original.credit)}`
        : "-",
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) =>
      `₹${money(row.original.balance)}`,
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) =>
      row.original.remarks || "-",
  },
];

export default function LedgerPage() {
  const [partyType, setPartyType] = useState<
    "CUSTOMER" | "SUPPLIER"
  >("CUSTOMER");

  const [partyId, setPartyId] = useState("");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: CustomerService.getAll,
    enabled: partyType === "CUSTOMER",
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: SupplierService.getAll,
    enabled: partyType === "SUPPLIER",
  });

  const {
    data: ledgerRows = [],
    isLoading,
  } = useQuery({
    queryKey: ["ledger", partyType, partyId],
    queryFn: () =>
      partyType === "CUSTOMER"
        ? LedgerService.getCustomerLedger(partyId)
        : LedgerService.getSupplierLedger(partyId),
    enabled: Boolean(partyId),
  });

  const parties =
    partyType === "CUSTOMER" ? customers : suppliers;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border">
          <Button
            type="button"
            variant={
              partyType === "CUSTOMER"
                ? "default"
                : "ghost"
            }
            className="rounded-none"
            onClick={() => {
              setPartyType("CUSTOMER");
              setPartyId("");
            }}
          >
            Customer Ledger
          </Button>

          <Button
            type="button"
            variant={
              partyType === "SUPPLIER"
                ? "default"
                : "ghost"
            }
            className="rounded-none"
            onClick={() => {
              setPartyType("SUPPLIER");
              setPartyId("");
            }}
          >
            Supplier Ledger
          </Button>
        </div>

        <select
          value={partyId}
          onChange={(e) =>
            setPartyId(e.target.value)
          }
          className="min-w-64 rounded-md border px-3 py-2 text-sm"
        >
          <option value="">
            Select{" "}
            {partyType === "CUSTOMER"
              ? "customer"
              : "supplier"}
            ...
          </option>

          {parties.map((party) => (
            <option key={party.id} value={party.id}>
              {"customerCode" in party
                ? party.customerCode
                : party.supplierCode}{" "}
              - {party.name}
            </option>
          ))}
        </select>
      </div>

      {partyId ? (
        <ERPDataTable
          columns={columns}
          data={ledgerRows}
          loading={isLoading}
          emptyMessage="No ledger entries yet."
        />
      ) : (
        <div className="rounded-md border bg-gray-50 p-8 text-center text-sm text-gray-500">
          Select a{" "}
          {partyType === "CUSTOMER"
            ? "customer"
            : "supplier"}{" "}
          to view their ledger.
        </div>
      )}
    </div>
  );
}
