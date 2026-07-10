"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useSubCategories } from "../hooks/useSubCategories";
import SubCategoryTable from "../components/SubCategoryTable";
import SubCategoryDialog from "../components/SubCategoryDialog";

import subCategoryService from "@/services/sub-category/sub-category.service";

import { SubCategory } from "../types/sub-category.types";

export default function SubCategoriesPage() {
  const { data = [], isLoading, refetch } = useSubCategories();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<SubCategory>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteSubCategory() {
    if (!selected) return;

    try {
      await subCategoryService.remove(selected.id);

      toast.success("Sub Category deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete Sub Category");
    }
  }

  const filtered = data.filter(
    (x: SubCategory) =>
      x.name.toLowerCase().includes(search.toLowerCase()) ||
      x.category.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search Sub Categories..."
        onSearch={setSearch}
        addLabel="Add Sub Category"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <SubCategoryTable
        data={filtered}
        loading={isLoading}
        onEdit={(subCategory) => {
          setSelected(subCategory);
          setDialogOpen(true);
        }}
        onDelete={(subCategory) => {
          setSelected(subCategory);
          setDeleteOpen(true);
        }}
      />

      <SubCategoryDialog
        open={dialogOpen}
        subCategory={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Sub Category"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteSubCategory}
      />
    </div>
  );
}