"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { Unit } from "../types/unit.types";

interface UnitColumnOptions {
  onEdit?(unit: Unit): void;
  onDelete?(unit: Unit): void;
}

export function getUnitColumns({
  onEdit,
  onDelete,
}: UnitColumnOptions): ColumnDef<Unit>[] {
  return [
    {
      accessorKey: "name",
      header: "Unit Name",
    },
    {
      accessorKey: "shortName",
      header: "Short Name",
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