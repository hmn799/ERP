"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import SchemeService from "@/services/scheme/scheme.service";

import type { Scheme } from "../types/scheme.types";

import SchemeForm, {
  SchemeFormValues,
} from "./SchemeForm";

interface SchemeDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  scheme?: Scheme;

  onSuccess?(): void;
}

export default function SchemeDialog({
  open,
  onOpenChange,
  scheme,
  onSuccess,
}: SchemeDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: SchemeFormValues,
  ) {
    try {
      setLoading(true);

      if (scheme) {
        await SchemeService.update(
          scheme.id,
          values,
        );

        toast.success("Scheme updated successfully.");
      } else {
        await SchemeService.create(values);

        toast.success("Scheme created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save scheme.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={scheme ? "Edit Scheme" : "New Scheme"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "scheme-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <SchemeForm
        defaultValues={
          scheme
            ? {
                name: scheme.name,
                schemeType: scheme.schemeType,
                itemId: scheme.itemId,
                buyQty: scheme.buyQty
                  ? Number(scheme.buyQty)
                  : undefined,
                freeQty: scheme.freeQty
                  ? Number(scheme.freeQty)
                  : undefined,
                freeItemId:
                  scheme.freeItemId ?? undefined,
                discountPercent:
                  scheme.discountPercent
                    ? Number(scheme.discountPercent)
                    : undefined,
                isActive: scheme.isActive,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}
