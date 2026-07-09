"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { Category } from "../types/category.types";
import { getCategoryColumns } from "./CategoryColumns";

interface CategoryTableProps {
  data: Category[];

  loading?: boolean;

  onEdit(category: Category): void;

  onDelete(category: Category): void;
}

export default function CategoryTable({
  data,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <ERPDataTable
      columns={getCategoryColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}