"use client";

import { ColumnDef } from "@tanstack/react-table";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";

import {
  DOCUMENT_TYPES,
  DocumentSeries,
} from "../types/document-series.types";

interface DocumentSeriesColumnOptions {
  onEdit?(documentSeries: DocumentSeries): void;
  onDelete?(documentSeries: DocumentSeries): void;
}

function typeLabel(value: string) {
  return (
    DOCUMENT_TYPES.find(
      (type) => type.value === value,
    )?.label ?? value
  );
}

function preview(series: DocumentSeries) {
  const nextNumber = series.currentNumber + 1;

  const padded = nextNumber
    .toString()
    .padStart(series.padding, "0");

  return `${series.prefix}${padded}${series.suffix ?? ""}`;
}

export function getDocumentSeriesColumns({
  onEdit,
  onDelete,
}: DocumentSeriesColumnOptions): ColumnDef<DocumentSeries>[] {
  return [
    {
      accessorKey: "documentType",
      header: "Document Type",
      cell: ({ row }) =>
        typeLabel(row.original.documentType),
    },
    {
      accessorKey: "name",
      header: "Series Name",
    },
    {
      id: "nextNumber",
      header: "Next Number",
      cell: ({ row }) => preview(row.original),
    },
    {
      accessorKey: "resetYearly",
      header: "Reset Yearly",
      cell: ({ row }) =>
        row.original.resetYearly ? "Yes" : "No",
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
