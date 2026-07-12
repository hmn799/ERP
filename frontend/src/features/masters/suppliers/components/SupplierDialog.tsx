"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import supplierService from "@/services/supplier/supplier.service";

import type { Supplier } from "../types/supplier.types";

import SupplierForm, {
  SupplierFormValues,
} from "./SupplierForm";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  supplier?: Supplier;
  onSuccess?(): void;
}

export default function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: SupplierFormValues,
  ) {
    try {
      setLoading(true);

      if (supplier) {
        await supplierService.update(
          supplier.id,
          values,
        );

        toast.success("Supplier updated successfully.");
      } else {
        await supplierService.create(values);

        toast.success("Supplier created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save supplier.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={supplier ? "Edit Supplier" : "New Supplier"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "supplier-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <SupplierForm
        defaultValues={
          supplier
            ? {
                supplierCode: supplier.supplierCode,
                name: supplier.name,
                gstType: supplier.gstType,
                gstin: supplier.gstin ?? "",
                mobile: supplier.mobile ?? "",
                email: supplier.email ?? "",
                address: supplier.address ?? "",
                city: supplier.city ?? "",
                state: supplier.state ?? "",
                pincode: supplier.pincode ?? "",
                openingBalance: supplier.openingBalance,
                isActive: supplier.isActive,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}