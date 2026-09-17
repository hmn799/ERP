"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import type { Item, CreateItemDto } from "../types/item.types";

import {
  InlineInputCell,
  InlineOption,
  InlineSelectCell,
} from "./ItemInlineEditCell";

interface Props {
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

export function getItemColumns({
  categories,
  subCategories,
  brands,
  gstSlabs,
  onEdit,
  onDelete,
  onFieldChange,
}: Props): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "itemCode",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Item",
      cell: ({ row }) => (
        <InlineInputCell
          value={row.original.name}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "name",
              value,
            )
          }
        />
      ),
    },
    {
      id: "hsnCode",
      header: "HSN",
      cell: ({ row }) => (
        <InlineInputCell
          value={row.original.hsnCode}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "hsnCode",
              value,
            )
          }
        />
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <InlineSelectCell
          value={row.original.categoryId}
          options={categories}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "categoryId",
              value,
            )
          }
        />
      ),
    },
    {
      id: "subCategory",
      header: "Sub Category",
      cell: ({ row }) => (
        <InlineSelectCell
          value={
            row.original.subCategoryId ?? ""
          }
          options={subCategories}
          allowEmpty
          onSave={(value) =>
            onFieldChange(
              row.original,
              "subCategoryId",
              value,
            )
          }
        />
      ),
    },
    {
      id: "brand",
      header: "Brand",
      cell: ({ row }) => (
        <InlineSelectCell
          value={row.original.brandId ?? ""}
          options={brands}
          allowEmpty
          onSave={(value) =>
            onFieldChange(
              row.original,
              "brandId",
              value,
            )
          }
        />
      ),
    },
    {
      id: "gstSlab",
      header: "GST",
      cell: ({ row }) => (
        <InlineSelectCell
          value={row.original.gstSlabId}
          options={gstSlabs}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "gstSlabId",
              value,
            )
          }
        />
      ),
    },
    {
      id: "mrp",
      header: "MRP",
      cell: ({ row }) => (
        <InlineInputCell
          type="number"
          value={row.original.mrp}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "mrp",
              Number(value),
            )
          }
        />
      ),
    },
    {
      id: "purchaseRate",
      header: "Purchase",
      cell: ({ row }) => (
        <InlineInputCell
          type="number"
          value={row.original.purchaseRate}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "purchaseRate",
              Number(value),
            )
          }
        />
      ),
    },
    {
      id: "minQty",
      header: "Min Qty",
      cell: ({ row }) => (
        <InlineInputCell
          type="number"
          value={row.original.minQty ?? 0}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "minQty",
              Number(value),
            )
          }
        />
      ),
    },
    {
      id: "reorderQty",
      header: "Reorder Qty",
      cell: ({ row }) => (
        <InlineInputCell
          type="number"
          value={row.original.reorderQty ?? 0}
          onSave={(value) =>
            onFieldChange(
              row.original,
              "reorderQty",
              Number(value),
            )
          }
        />
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? "Active" : "Inactive",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(row.original)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}
