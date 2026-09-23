"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDataTable from "@/components/erp/crud/ERPDataTable";
import { Button } from "@/components/ui/button";

import AdjustmentNoteService, {
  AdjustmentNote,
  AdjustmentNoteType,
} from "@/services/adjustment-note/adjustment-note.service";

import CreateAdjustmentNoteDialog from "../components/CreateAdjustmentNoteDialog";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface AdjustmentNotesPageProps {
  noteType: AdjustmentNoteType;
}

export default function AdjustmentNotesPage({
  noteType,
}: AdjustmentNotesPageProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const label = noteType === "DEBIT" ? "Debit" : "Credit";
  const partyLabel =
    noteType === "DEBIT" ? "Supplier" : "Customer";

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adjustment-notes", noteType],
    queryFn: () => AdjustmentNoteService.getAll(noteType),
  });

  async function handleCancel(row: AdjustmentNote) {
    if (
      !confirm(
        `Cancel ${row.noteNo}? This reverses its effect on ${row.partyName}'s balance.`,
      )
    ) {
      return;
    }

    try {
      await AdjustmentNoteService.cancel(row.id);
      toast.success(`${row.noteNo} cancelled.`);
      refetch();
    } catch {
      toast.error("Failed to cancel note.");
    }
  }

  const filtered = data.filter(
    (row) =>
      row.noteNo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      row.partyName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      row.reason
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const columns: ColumnDef<AdjustmentNote>[] = [
    { accessorKey: "noteNo", header: "No." },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.noteDate).toLocaleDateString(),
    },
    { accessorKey: "partyName", header: partyLabel },
    { accessorKey: "reason", header: "Reason" },
    {
      id: "netAmount",
      header: "Amount",
      cell: ({ row }) =>
        `₹${money(Number(row.original.netAmount))}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={
            row.original.status === "CANCELLED"
              ? "text-muted-foreground line-through"
              : "text-green-700"
          }
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.status === "ACTIVE" ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleCancel(row.original)}
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  const total = filtered
    .filter((row) => row.status === "ACTIVE")
    .reduce((sum, row) => sum + Number(row.netAmount), 0);

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder={`Search by no., ${partyLabel.toLowerCase()}, or reason...`}
        onSearch={setSearch}
        addLabel={`New ${label} Note`}
        onRefresh={refetch}
        onAdd={() => setCreateOpen(true)}
      />

      <div className="text-sm">
        Total Active {label} Notes:{" "}
        <span className="font-semibold">
          ₹{money(total)}
        </span>
      </div>

      <ERPDataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
      />

      <CreateAdjustmentNoteDialog
        open={createOpen}
        noteType={noteType}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
