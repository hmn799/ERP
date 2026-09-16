"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import LedgerService from "@/services/ledger/ledger.service";

import ReceiptForm, {
  ReceiptFormValues,
} from "../components/ReceiptForm";

import type { Receipt } from "../../types/ledger.types";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const columns: ColumnDef<Receipt>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Date(
        row.original.date,
      ).toLocaleDateString("en-IN"),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) =>
      `${row.original.customerCode} - ${row.original.customerName}`,
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

export default function ReceiptsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["receipts"],
    queryFn: LedgerService.listReceipts,
  });

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    values: ReceiptFormValues,
  ) {
    if (!values.customerId) {
      toast.error("Select a customer.");
      return;
    }

    try {
      setSaving(true);

      await LedgerService.createReceipt(values);

      toast.success("Receipt recorded.");

      setDialogOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error("Failed to record receipt.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = data.filter(
    (receipt) =>
      receipt.customerName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      receipt.customerCode
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search receipts by customer..."
        onSearch={setSearch}
        addLabel="Record Receipt"
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
        title="Record Receipt"
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {
          const form = document.getElementById(
            "receipt-form",
          ) as HTMLFormElement | null;

          form?.requestSubmit();
        }}
      >
        <ReceiptForm
          loading={saving}
          onSubmit={handleSubmit}
        />
      </ERPFormDialog>
    </div>
  );
}
