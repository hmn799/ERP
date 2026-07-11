"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { Customer } from "../types/customer.types";

interface CustomerColumnOptions {
  onEdit?(customer: Customer): void;
  onDelete?(customer: Customer): void;
}

export function getCustomerColumns({
  onEdit,
  onDelete,
}: CustomerColumnOptions): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "customerCode",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Customer",
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