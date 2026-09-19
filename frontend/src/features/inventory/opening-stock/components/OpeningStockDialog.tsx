"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import OpeningStockService, {
  type CreateOpeningStockDto,
} from "@/services/opening-stock/opening-stock.service";

import OpeningStockForm from "./OpeningStockForm";

interface OpeningStockDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSuccess?(): void;
}

export default function OpeningStockDialog({
  open,
  onOpenChange,
  onSuccess,
}: OpeningStockDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: CreateOpeningStockDto) {
    if (!values.itemId) {
      toast.error("Select an item.");
      return;
    }

    if (!values.warehouseId) {
      toast.error("Select a warehouse.");
      return;
    }

    if (!values.qty || values.qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    try {
      setLoading(true);

      await OpeningStockService.create(values);

      toast.success("Opening stock added successfully.");

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add opening stock.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title="Add Opening Stock"
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "opening-stock-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <OpeningStockForm loading={loading} onSubmit={handleSubmit} />
    </ERPFormDialog>
  );
}
