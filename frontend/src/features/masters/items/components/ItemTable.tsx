"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import type { Item } from "../types/item.types";
import { getItemColumns } from "./ItemColumns";

interface Props {
  items: Item[];

  onEdit(item: Item): void;

  onDelete(item: Item): void;
}

export default function ItemTable({
  items,
  onEdit,
  onDelete,
}: Props) {
  return (
    <ERPDataTable
  columns={getItemColumns({
    onEdit,
    onDelete,
  })}
  data={items}
/>
  );
}