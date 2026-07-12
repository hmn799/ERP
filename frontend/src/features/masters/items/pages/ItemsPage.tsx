"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useItems } from "../hooks/useItems";
import ItemTable from "../components/ItemTable";
import ItemDialog from "../components/ItemDialog";

import itemService from "@/services/item/item.service";

import type { Item } from "../types/item.types";

export default function ItemsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useItems();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<Item>();

  const [deleteOpen, setDeleteOpen] =
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
      />

      <ItemTable
        items={filtered}
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
    </div>
  );
}