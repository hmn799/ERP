"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { StockTransferListItem } from "@/services/stock-transfer/stock-transfer.service";

interface StockTransferColumnOptions {
  onDelete(transfer: StockTransferListItem): void;
}

export function getStockTransferColumns({
  onDelete,
}: StockTransferColumnOptions): ColumnDef<StockTransferListItem>[] {
  return [
    {
      accessorKey: "transferNo",
      header: "Transfer No",
    },
    {
      accessorKey: "transferDate",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.transferDate).toLocaleDateString(),
    },
    {
      id: "from",
      header: "From",
      cell: ({ row }) => row.original.fromWarehouse.name,
    },
    {
      id: "to",
      header: "To",
      cell: ({ row }) => row.original.toWarehouse.name,
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original.items.length,
    },
    {
      id: "totalQty",
      header: "Total Qty",
      cell: ({ row }) =>
        row.original.items.reduce(
          (sum, item) => sum + Number(item.qty),
          0,
        ),
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
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="outline" asChild>
            <Link href={`/inventory/stock-transfer/view/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

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
