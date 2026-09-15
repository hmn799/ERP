"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { Unit } from "../types/unit.types";
import { getUnitColumns } from "./UnitColumns";

interface UnitTableProps {
  data: Unit[];

  loading?: boolean;

  onEdit(unit: Unit): void;

  onDelete(unit: Unit): void;
}

export default function UnitTable({
  data,
  loading,

  onEdit,

  onDelete,
}: UnitTableProps) {
  return (
    <ERPDataTable
      data={data}
      loading={loading}
      columns={getUnitColumns({
        onEdit,
        onDelete,
      })}
    />
  );
}