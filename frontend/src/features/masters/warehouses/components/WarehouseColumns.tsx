"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { Warehouse } from "../types/warehouse.types";

interface WarehouseColumnOptions {
  onEdit?(warehouse: Warehouse): void;
  onDelete?(warehouse: Warehouse): void;
}

export function getWarehouseColumns({
  onEdit,
  onDelete,
}: WarehouseColumnOptions): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "name",
      header: "Warehouse",
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