"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { CategoryService } from "@/services/category/category.service";

import type { Category } from "../types/category.types";
import CategoryForm, {
  CategoryFormValues,
} from "./CategoryForm";

interface CategoryDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  category?: Category;

  onSuccess?(): void;
}

export default function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: CategoryFormValues,
  ) {
    try {
      setLoading(true);

      if (category) {
        await CategoryService.update(
          category.id,
          values,
        );

        toast.success(
          "Category updated successfully.",
        );
      } else {
        await CategoryService.create(values);

        toast.success(
          "Category created successfully.",
        );
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to save category.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={
        category
          ? "Edit Category"
          : "New Category"
      }
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "category-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <CategoryForm
        defaultValues={
          category
            ? {
                name: category.name,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}