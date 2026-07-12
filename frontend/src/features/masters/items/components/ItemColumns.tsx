"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import type { Item } from "../types/item.types";

interface Props {
  onEdit(item: Item): void;
  onDelete(item: Item): void;
}

export function getItemColumns({
  onEdit,
  onDelete,
}: Props): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "itemCode",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Item",
    },
    {
      accessorFn: (row) => row.category?.name,
      header: "Category",
    },
    {
      accessorFn: (row) => row.subCategory?.name,
      header: "Sub Category",
    },
    {
      accessorFn: (row) => row.brand?.name,
      header: "Brand",
    },
    {
      accessorFn: (row) => row.gstSlab?.name,
      header: "GST",
    },
    {
      accessorKey: "mrp",
      header: "MRP",
    },
    {
      accessorKey: "purchaseRate",
      header: "Purchase",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? "Active" : "Inactive",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(row.original)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}