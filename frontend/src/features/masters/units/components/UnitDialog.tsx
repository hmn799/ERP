"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import { UnitService } from "@/services/unit/unit.service";

import type { Unit } from "../types/unit.types";
import UnitForm, { UnitFormValues } from "./UnitForm";

interface UnitDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  unit?: Unit | null;
  onSuccess?(): void;
}

export default function UnitDialog({
  open,
  onOpenChange,
  unit,
  onSuccess,
}: UnitDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: UnitFormValues) {
    try {
      setLoading(true);

      if (unit) {
        await UnitService.update(unit.id, values);
        toast.success("Unit updated successfully.");
      } else {
        await UnitService.create(values);
        toast.success("Unit created successfully.");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save unit.");
    } finally {
      setLoading(false);
    }
  }

  function submitForm() {
    const form = document.getElementById("unit-form");

    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={unit ? "Edit Unit" : "Add Unit"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={submitForm}
    >
      <UnitForm
        defaultValues={
          unit
            ? {
                name: unit.name,
                shortName: unit.shortName,
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}