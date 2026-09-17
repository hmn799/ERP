"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import type { Item, CreateItemDto } from "../types/item.types";
import { getItemColumns } from "./ItemColumns";
import { InlineOption } from "./ItemInlineEditCell";

interface Props {
  items: Item[];

  categories: InlineOption[];
  subCategories: InlineOption[];
  brands: InlineOption[];
  gstSlabs: InlineOption[];

  onEdit(item: Item): void;

  onDelete(item: Item): void;

  onFieldChange(
    item: Item,
    field: keyof CreateItemDto,
    value: string | number,
  ): Promise<void>;
}

export default function ItemTable({
  items,
  categories,
  subCategories,
  brands,
  gstSlabs,
  onEdit,
  onDelete,
  onFieldChange,
}: Props) {
  return (
    <ERPDataTable
  columns={getItemColumns({
    categories,
    subCategories,
    brands,
    gstSlabs,
    onEdit,
    onDelete,
    onFieldChange,
  })}
  data={items}
/>
  );
}
