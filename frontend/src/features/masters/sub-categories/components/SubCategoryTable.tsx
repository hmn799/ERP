"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { SubCategory } from "../types/sub-category.types";
import { getSubCategoryColumns } from "./SubCategoryColumns";

interface SubCategoryTableProps {
  data: SubCategory[];

  loading?: boolean;

  onEdit(subCategory: SubCategory): void;

  onDelete(subCategory: SubCategory): void;
}

export default function SubCategoryTable({
  data,
  onEdit,
  onDelete,
}: SubCategoryTableProps) {
  return (
    <ERPDataTable
      columns={getSubCategoryColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}