"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { WarehouseService } from "@/services/warehouse/warehouse.service";

import type { Warehouse } from "../types/warehouse.types";

import WarehouseForm, {
  WarehouseFormValues,
} from "./WarehouseForm";

interface WarehouseDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  warehouse?: Warehouse;

  onSuccess?(): void;
}

export default function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: WarehouseDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: WarehouseFormValues,
  ) {
    try {
      setLoading(true);

      if (warehouse) {
        await WarehouseService.update(
          warehouse.id,
          values,
        );

        toast.success("Warehouse updated successfully.");
      } else {
        await WarehouseService.create(values);

        toast.success("Warehouse created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save Warehouse.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={warehouse ? "Edit Warehouse" : "New Warehouse"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "warehouse-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <WarehouseForm
        defaultValues={
          warehouse
            ? {
                name: warehouse.name,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}