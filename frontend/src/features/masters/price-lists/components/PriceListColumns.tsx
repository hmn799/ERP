"use client";

import { ColumnDef } from "@tanstack/react-table";
import ActionColumn from "@/components/erp/crud/columns/ActionColumn";
import { PriceList } from "../types/price-list.types";

interface PriceListColumnOptions {
  onEdit?(priceList: PriceList): void;
  onDelete?(priceList: PriceList): void;
}

export function getPriceListColumns({
  onEdit,
  onDelete,
}: PriceListColumnOptions): ColumnDef<PriceList>[] {
  return [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "priority",
      header: "Priority",
    },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ row }) =>
        row.original.isDefault ? "Yes" : "No",
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