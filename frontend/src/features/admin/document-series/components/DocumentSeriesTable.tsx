"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { DocumentSeries } from "../types/document-series.types";
import { getDocumentSeriesColumns } from "./DocumentSeriesColumns";

interface DocumentSeriesTableProps {
  data: DocumentSeries[];

  loading?: boolean;

  onEdit(documentSeries: DocumentSeries): void;

  onDelete(documentSeries: DocumentSeries): void;
}

export default function DocumentSeriesTable({
  data,
  loading,
  onEdit,
  onDelete,
}: DocumentSeriesTableProps) {
  return (
    <ERPDataTable
      columns={getDocumentSeriesColumns({
        onEdit,
        onDelete,
      })}
      data={data}
      loading={loading}
    />
  );
}
