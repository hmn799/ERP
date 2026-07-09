"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { Category } from "../types/category.types";

interface CategoryColumnOptions {
  onEdit?(category: Category): void;
  onDelete?(category: Category): void;
}

export function getCategoryColumns({
  onEdit,
  onDelete,
}: CategoryColumnOptions): ColumnDef<Category>[] {
  return [
    {
      accessorKey: "name",
      header: "Category Name",
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