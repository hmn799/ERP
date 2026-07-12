"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { Supplier } from "../types/supplier.types";
import { getSupplierColumns } from "./SupplierColumns";

interface SupplierTableProps {
  data: Supplier[];

  loading?: boolean;

  onEdit(supplier: Supplier): void;

  onDelete(supplier: Supplier): void;
}

export default function SupplierTable({
  data,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  return (
    <ERPDataTable
      columns={getSupplierColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}