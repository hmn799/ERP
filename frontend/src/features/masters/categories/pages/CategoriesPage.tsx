"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useCategories } from "../hooks/useCategories";
import CategoryTable from "../components/CategoryTable";
import CategoryDialog from "../components/CategoryDialog";

import categoryService from "@/services/category/category.service";

import { Category } from "../types/category.types";

export default function CategoriesPage() {
  const { data = [], isLoading, refetch } = useCategories();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<Category>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteCategory() {
    if (!selected) return;

    try {
      await categoryService.remove(selected.id);

      toast.success("Category deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete category");
    }
  }

  const filtered = data.filter((x: Category) =>
    x.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Categories..."
        onSearch={setSearch}
        addLabel="Add Category"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <CategoryTable
        data={filtered}
        loading={isLoading}
        onEdit={(category) => {
          setSelected(category);
          setDialogOpen(true);
        }}
        onDelete={(category) => {
          setSelected(category);
          setDeleteOpen(true);
        }}
      />

      <CategoryDialog
        open={dialogOpen}
        category={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Category"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteCategory}
      />

    </div>
  );
}