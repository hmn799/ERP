"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import ActionColumn from "@/components/erp/crud/columns/ActionColumn";
import { PriceList } from "../types/price-list.types";

interface PriceListColumnOptions {
  onEdit?(priceList: PriceList): void;
  onDelete?(priceList: PriceList): void;
  onRates?(priceList: PriceList): void;
}

export function getPriceListColumns({
  onEdit,
  onDelete,
  onRates,
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
      id: "rates",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRates?.(row.original)}
        >
          Item Rates
        </Button>
      ),
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