"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { SubCategory } from "../types/sub-category.types";

interface SubCategoryColumnOptions {
  onEdit?(subCategory: SubCategory): void;
  onDelete?(subCategory: SubCategory): void;
}

export function getSubCategoryColumns({
  onEdit,
  onDelete,
}: SubCategoryColumnOptions): ColumnDef<SubCategory>[] {
  return [
    {
      accessorKey: "name",
      header: "Sub Category",
    },
    {
      accessorFn: (row) => row.category?.name,
      id: "category",
      header: "Category",
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