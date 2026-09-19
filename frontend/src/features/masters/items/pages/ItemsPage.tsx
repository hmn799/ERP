"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";
import ImportMastersDialog from "@/components/erp/crud/ImportMastersDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

import { useItems } from "../hooks/useItems";
import ItemTable from "../components/ItemTable";
import ItemDialog from "../components/ItemDialog";
import { InlineOption } from "../components/ItemInlineEditCell";

import itemService from "@/services/item/item.service";
import categoryService from "@/services/category/category.service";
import subCategoryService from "@/services/sub-category/sub-category.service";
import brandService from "@/services/brand/brand.service";
import gstSlabService from "@/services/gst-slab/gst-slab.service";

import type { Item, CreateItemDto } from "../types/item.types";

export default function ItemsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useItems();

  const [search, setSearch] = useState("");

  const [categories, setCategories] =
    useState<InlineOption[]>([]);

  const [subCategories, setSubCategories] =
    useState<InlineOption[]>([]);

  const [brands, setBrands] = useState<
    InlineOption[]
  >([]);

  const [gstSlabs, setGstSlabs] = useState<
    InlineOption[]
  >([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
    subCategoryService
      .getAll()
      .then(setSubCategories);
    brandService.getAll().then(setBrands);
    gstSlabService.getAll().then(setGstSlabs);
  }, []);

  /*
   * Inline edits from the list table - saves a single field
   * immediately via PATCH, then refetches so every column (and any
   * derived display, like the GST/Category name) stays in sync.
   */
  async function handleFieldChange(
    item: Item,
    field: keyof CreateItemDto,
    value: string | number,
  ) {
    await itemService.update(item.id, {
      [field]: value,
    });

    toast.success("Item updated.");

    refetch();
  }

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<Item>();

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [importOpen, setImportOpen] =
    useState(false);

  async function deleteItem() {
    if (!selected) return;

    try {
      await itemService.remove(selected.id);

      toast.success("Item deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete item");
    }
  }

  const filtered = data.filter(
    (x) =>
      x.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      x.itemCode
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search Items..."
        onSearch={setSearch}
        addLabel="Add Item"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
        extraActions={
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        }
      />

      <ItemTable
        items={filtered}
        categories={categories}
        subCategories={subCategories}
        brands={brands}
        gstSlabs={gstSlabs}
        onFieldChange={handleFieldChange}
        onEdit={(item) => {
          setSelected(item);
          setDialogOpen(true);
        }}
        onDelete={(item) => {
          setSelected(item);
          setDeleteOpen(true);
        }}
      />

      <ItemDialog
        open={dialogOpen}
        item={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Item"
        description={`Delete "${selected?.name}" ?`}
        onClose={() =>
          setDeleteOpen(false)
        }
        onConfirm={deleteItem}
      />

      <ImportMastersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Items"
        entity="item"
        templateHeaders={[
          "Item Name",
          "HSN Code",
          "Barcode",
          "Category",
          "Sub Category",
          "Brand",
          "GST Slab",
          "Base Unit",
          "Purchase Unit",
          "Sale Unit",
          "MRP",
          "Purchase Rate",
          "Min Qty",
          "Reorder Qty",
        ]}
        templateSample={[
          "Surf Excel 1kg",
          "34022090",
          "",
          "Detergent",
          "",
          "Surf",
          "18",
          "PCS",
          "",
          "",
          "150",
          "120",
          "0",
          "0",
        ]}
        helpText="Category, Sub Category, Brand, GST Slab, and Unit names must already exist in their masters - rows with an unrecognized name are skipped. Leave Purchase/Sale Unit blank to use Base Unit for both."
        onSuccess={refetch}
      />
    </div>
  );
}