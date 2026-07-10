"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { PriceListService } from "@/services/price-list/price-list.service";

import type { PriceList } from "../types/price-list.types";

import PriceListForm, {
  PriceListFormValues,
} from "./PriceListForm";

interface PriceListDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  priceList?: PriceList;

  onSuccess?(): void;
}

export default function PriceListDialog({
  open,
  onOpenChange,
  priceList,
  onSuccess,
}: PriceListDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: PriceListFormValues,
  ) {
    try {
      setLoading(true);

      if (priceList) {
        await PriceListService.update(
          priceList.id,
          values,
        );

        toast.success("Price List updated successfully.");
      } else {
        await PriceListService.create(values);

        toast.success("Price List created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save Price List.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={priceList ? "Edit Price List" : "New Price List"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "price-list-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <PriceListForm
        defaultValues={
          priceList
            ? {
                code: priceList.code,
                name: priceList.name,
                description: priceList.description ?? "",
                priority: priceList.priority,
                isDefault: priceList.isDefault,
                isActive: priceList.isActive,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}