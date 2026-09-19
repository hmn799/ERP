"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { OpeningStockEntry } from "@/services/opening-stock/opening-stock.service";

interface OpeningStockColumnOptions {
  onDelete(entry: OpeningStockEntry): void;
}

export function getOpeningStockColumns({
  onDelete,
}: OpeningStockColumnOptions): ColumnDef<OpeningStockEntry>[] {
  return [
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.transactionDate).toLocaleDateString(),
    },
    {
      id: "item",
      header: "Item",
      cell: ({ row }) =>
        `${row.original.item.itemCode} - ${row.original.item.name}`,
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => row.original.warehouse.name,
    },
    {
      id: "batchNo",
      header: "Batch No",
      cell: ({ row }) => row.original.batch.batchNo,
    },
    {
      accessorKey: "qtyIn",
      header: "Qty",
      cell: ({ row }) => Number(row.original.qtyIn),
    },
    {
      id: "mrp",
      header: "MRP",
      cell: ({ row }) => `₹${Number(row.original.batch.mrp).toFixed(2)}`,
    },
    {
      id: "expiryDate",
      header: "Expiry",
      cell: ({ row }) =>
        row.original.batch.expiryDate
          ? new Date(row.original.batch.expiryDate).toLocaleDateString()
          : "-",
    },
    {
      id: "remarks",
      header: "Remarks",
      cell: ({ row }) => row.original.remarks || "-",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
