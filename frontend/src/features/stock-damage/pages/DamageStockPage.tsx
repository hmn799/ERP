"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDataTable from "@/components/erp/crud/ERPDataTable";
import { Button } from "@/components/ui/button";

import StockDamageService, {
  StockDamage,
} from "@/services/stock-damage/stock-damage.service";

import CreateDamageDialog from "../components/CreateDamageDialog";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function DamageStockPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["stock-damage"],
    queryFn: StockDamageService.getAll,
  });

  async function handleCancel(row: StockDamage) {
    if (
      !confirm(
        `Reverse this write-off and restore ${Number(row.qty)} units to stock?`,
      )
    ) {
      return;
    }

    try {
      await StockDamageService.cancel(row.id);
      toast.success("Write-off reversed, stock restored.");
      refetch();
    } catch {
      toast.error("Failed to reverse write-off.");
    }
  }

  const filtered = data.filter(
    (row) =>
      row.damageNo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      row.item?.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      row.reason
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const totalLoss = filtered
    .filter((row) => row.status === "ACTIVE")
    .reduce((sum, row) => sum + Number(row.costValue), 0);

  const columns: ColumnDef<StockDamage>[] = [
    { accessorKey: "damageNo", header: "No." },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(
          row.original.damageDate,
        ).toLocaleDateString(),
    },
    {
      id: "item",
      header: "Item",
      cell: ({ row }) =>
        row.original.item
          ? `${row.original.item.itemCode} - ${row.original.item.name}`
          : "-",
    },
    {
      id: "batch",
      header: "Batch",
      cell: ({ row }) => row.original.batch?.batchNo ?? "-",
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) =>
        row.original.warehouse?.name ?? "-",
    },
    { accessorKey: "qty", header: "Qty" },
    {
      id: "costValue",
      header: "Loss Value",
      cell: ({ row }) =>
        `₹${money(Number(row.original.costValue))}`,
    },
    { accessorKey: "reason", header: "Reason" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={
            row.original.status === "CANCELLED"
              ? "text-muted-foreground line-through"
              : "text-red-600"
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
            Reverse
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search by no., item, or reason..."
        onSearch={setSearch}
        addLabel="Write Off Stock"
        onRefresh={refetch}
        onAdd={() => setCreateOpen(true)}
      />

      <div className="text-sm">
        Total Active Loss:{" "}
        <span className="font-semibold text-red-600">
          ₹{money(totalLoss)}
        </span>
      </div>

      <ERPDataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
      />

      <CreateDamageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
