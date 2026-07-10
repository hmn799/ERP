"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { SubCategoryService } from "@/services/sub-category/sub-category.service";

import type { SubCategory } from "../types/sub-category.types";

import SubCategoryForm, {
  SubCategoryFormValues,
} from "./SubCategoryForm";

interface SubCategoryDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  subCategory?: SubCategory;

  onSuccess?(): void;
}

export default function SubCategoryDialog({
  open,
  onOpenChange,
  subCategory,
  onSuccess,
}: SubCategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: SubCategoryFormValues,
  ) {
    try {
      setLoading(true);

      if (subCategory) {
        await SubCategoryService.update(
          subCategory.id,
          values,
        );

        toast.success(
          "Sub Category updated successfully.",
        );
      } else {
        await SubCategoryService.create(values);

        toast.success(
          "Sub Category created successfully.",
        );
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to save Sub Category.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={
        subCategory
          ? "Edit Sub Category"
          : "New Sub Category"
      }
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "sub-category-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <SubCategoryForm
        defaultValues={
          subCategory
            ? {
                name: subCategory.name,
                categoryId: subCategory.categoryId,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}