"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import LedgerService from "@/services/ledger/ledger.service";

import PaymentForm, {
  PaymentFormValues,
} from "../components/PaymentForm";

import type { Payment } from "../../types/ledger.types";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Date(
        row.original.date,
      ).toLocaleDateString("en-IN"),
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) =>
      `${row.original.supplierCode} - ${row.original.supplierName}`,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      `₹${money(row.original.amount)}`,
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) =>
      row.original.remarks || "-",
  },
];

export default function PaymentsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["payments"],
    queryFn: LedgerService.listPayments,
  });

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    values: PaymentFormValues,
  ) {
    if (!values.supplierId) {
      toast.error("Select a supplier.");
      return;
    }

    try {
      setSaving(true);

      await LedgerService.createPayment(values);

      toast.success("Payment recorded.");

      setDialogOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error("Failed to record payment.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = data.filter(
    (payment) =>
      payment.supplierName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      payment.supplierCode
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search payments by supplier..."
        onSearch={setSearch}
        addLabel="Record Payment"
        onRefresh={refetch}
        onAdd={() => setDialogOpen(true)}
      />

      <ERPDataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
      />

      <ERPFormDialog
        open={dialogOpen}
        title="Record Payment"
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {
          const form = document.getElementById(
            "payment-form",
          ) as HTMLFormElement | null;

          form?.requestSubmit();
        }}
      >
        <PaymentForm
          loading={saving}
          onSubmit={handleSubmit}
        />
      </ERPFormDialog>
    </div>
  );
}
