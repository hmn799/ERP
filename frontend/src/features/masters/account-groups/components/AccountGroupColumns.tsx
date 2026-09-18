"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { AccountGroup } from "../types/account-group.types";

interface AccountGroupColumnOptions {
  onEdit?(accountGroup: AccountGroup): void;
  onDelete?(accountGroup: AccountGroup): void;
}

const NATURE_TYPE_LABELS: Record<string, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  INCOME: "Income",
  EXPENSE: "Expense",
};

export function getAccountGroupColumns({
  onEdit,
  onDelete,
}: AccountGroupColumnOptions): ColumnDef<AccountGroup>[] {
  return [
    {
      accessorKey: "name",
      header: "Group Name",
    },
    {
      accessorKey: "natureType",
      header: "Nature",
      cell: ({ row }) =>
        NATURE_TYPE_LABELS[
          row.original.natureType
        ] ?? row.original.natureType,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) =>
        row.original.description || "-",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive
          ? "Active"
          : "Inactive",
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
