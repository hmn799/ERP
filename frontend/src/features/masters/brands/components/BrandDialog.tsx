"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { BrandService } from "@/services/brand/brand.service";

import type { Brand } from "../types/brand.types";
import BrandForm, { BrandFormValues } from "./BrandForm";

interface BrandDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  brand?: Brand;

  onSuccess?(): void;
}

export default function BrandDialog({
  open,
  onOpenChange,
  brand,
  onSuccess,
}: BrandDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: BrandFormValues) {
    try {
      setLoading(true);

      if (brand) {
        await BrandService.update(brand.id, values);
        toast.success("Brand updated successfully.");
      } else {
        await BrandService.create(values);
        toast.success("Brand created successfully.");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save brand.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={brand ? "Edit Brand" : "New Brand"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "brand-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <BrandForm
        defaultValues={
          brand
            ? {
                name: brand.name,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}