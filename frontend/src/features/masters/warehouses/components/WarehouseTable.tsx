"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { Warehouse } from "../types/warehouse.types";
import { getWarehouseColumns } from "./WarehouseColumns";

interface WarehouseTableProps {
  data: Warehouse[];
  loading?: boolean;

  onEdit(warehouse: Warehouse): void;
  onDelete(warehouse: Warehouse): void;
}

export default function WarehouseTable({
  data,
  onEdit,
  onDelete,
}: WarehouseTableProps) {
  return (
    <ERPDataTable
      columns={getWarehouseColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}