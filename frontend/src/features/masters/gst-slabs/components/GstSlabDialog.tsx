"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { GstSlabService } from "@/services/gst-slab/gst-slab.service";

import type { GstSlab } from "../types/gst-slab.types";

import GstSlabForm, {
  GstSlabFormValues,
} from "./GstSlabForm";

interface GstSlabDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  gstSlab?: GstSlab;

  onSuccess?(): void;
}

export default function GstSlabDialog({
  open,
  onOpenChange,
  gstSlab,
  onSuccess,
}: GstSlabDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: GstSlabFormValues,
  ) {
    try {
      setLoading(true);

      if (gstSlab) {
        await GstSlabService.update(
          gstSlab.id,
          values,
        );

        toast.success("GST Slab updated successfully.");
      } else {
        await GstSlabService.create(values);

        toast.success("GST Slab created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save GST Slab.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={gstSlab ? "Edit GST Slab" : "New GST Slab"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "gst-slab-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <GstSlabForm
        defaultValues={
          gstSlab
            ? {
                name: gstSlab.name,
                percentage: gstSlab.percentage,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}