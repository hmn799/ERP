"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { Supplier } from "../types/supplier.types";

interface SupplierColumnOptions {
  onEdit?(supplier: Supplier): void;
  onDelete?(supplier: Supplier): void;
}

export function getSupplierColumns({
  onEdit,
  onDelete,
}: SupplierColumnOptions): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: "supplierCode",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Supplier",
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
    },
    {
      accessorKey: "gstin",
      header: "GSTIN",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? "Active" : "Inactive",
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