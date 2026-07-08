"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import type { Brand } from "../types/brand.types";

interface BrandColumnOptions {
  onEdit?(brand: Brand): void;
  onDelete?(brand: Brand): void;
}

export function getBrandColumns({
  onEdit,
  onDelete,
}: BrandColumnOptions): ColumnDef<Brand>[] {
  return [
    {
      accessorKey: "name",
      header: "Brand Name",
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