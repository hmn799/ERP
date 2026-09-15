"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import { Scheme } from "../types/scheme.types";

interface SchemeColumnOptions {
  onEdit?(scheme: Scheme): void;
  onDelete?(scheme: Scheme): void;
}

function describeScheme(scheme: Scheme) {
  if (scheme.schemeType === "QUANTITY") {
    return `Buy ${scheme.buyQty} get ${scheme.freeQty} free`;
  }

  if (scheme.schemeType === "FREE_ITEM") {
    return `Buy ${scheme.buyQty} get ${scheme.freeQty} free of ${
      scheme.freeItem
        ? `${scheme.freeItem.itemCode} - ${scheme.freeItem.name}`
        : "another item"
    }`;
  }

  return `${scheme.discountPercent}% off`;
}

export function getSchemeColumns({
  onEdit,
  onDelete,
}: SchemeColumnOptions): ColumnDef<Scheme>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "schemeType",
      header: "Type",
    },
    {
      id: "item",
      header: "Trigger Item",
      cell: ({ row }) =>
        row.original.item
          ? `${row.original.item.itemCode} - ${row.original.item.name}`
          : "-",
    },
    {
      id: "rule",
      header: "Rule",
      cell: ({ row }) => describeScheme(row.original),
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) =>
        row.original.isActive ? "Yes" : "No",
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
