"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { GstSlab } from "../types/gst-slab.types";

interface GstSlabColumnOptions {
  onEdit?(gstSlab: GstSlab): void;
  onDelete?(gstSlab: GstSlab): void;
}

export function getGstSlabColumns({
  onEdit,
  onDelete,
}: GstSlabColumnOptions): ColumnDef<GstSlab>[] {
  return [
    {
      accessorKey: "name",
      header: "GST Name",
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => `${row.original.percentage}%`,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];
}