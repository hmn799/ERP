"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { SalesOrderListItem } from "@/services/sales-order/sales-order.service";

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "border-green-200 bg-green-50 text-green-700",
  PARTIAL: "border-yellow-200 bg-yellow-50 text-yellow-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  PENDING: "border-gray-200 bg-white text-gray-700",
};

export function getSalesOrderColumns(): ColumnDef<SalesOrderListItem>[] {
  return [
    {
      accessorKey: "soNo",
      header: "Order No",
    },
    {
      accessorKey: "soDate",
      header: "Date",
      cell: ({ row }) => new Date(row.original.soDate).toLocaleDateString(),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => row.original.customer?.name || "Walk-in",
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => row.original.warehouse?.name || "-",
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original.items.length,
    },
    {
      id: "netAmount",
      header: "Net Amount",
      cell: ({ row }) =>
        `₹${Number(row.original.netAmount).toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            STATUS_CLASS[row.original.status] ?? STATUS_CLASS.PENDING
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="icon" variant="outline" asChild>
            <Link href={`/sales-order/view/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];
}
