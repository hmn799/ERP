"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { Scheme } from "../types/scheme.types";
import { getSchemeColumns } from "./SchemeColumns";

interface SchemeTableProps {
  data: Scheme[];

  loading?: boolean;

  onEdit(scheme: Scheme): void;

  onDelete(scheme: Scheme): void;
}

export default function SchemeTable({
  data,
  onEdit,
  onDelete,
}: SchemeTableProps) {
  return (
    <ERPDataTable
      columns={getSchemeColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}
