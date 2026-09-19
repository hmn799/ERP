"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import FinancialYearService, {
  type CreateFinancialYearDto,
} from "@/services/financial-year/financial-year.service";

import FinancialYearForm from "./FinancialYearForm";

interface FinancialYearDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSuccess?(): void;
}

export default function FinancialYearDialog({
  open,
  onOpenChange,
  onSuccess,
}: FinancialYearDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: CreateFinancialYearDto) {
    if (!values.name.trim()) {
      toast.error("Enter a name.");
      return;
    }

    if (!values.startDate || !values.endDate) {
      toast.error("Select both a start and end date.");
      return;
    }

    try {
      setLoading(true);

      await FinancialYearService.create(values);

      toast.success("Financial year created.");

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to create financial year.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title="New Financial Year"
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "financial-year-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <FinancialYearForm loading={loading} onSubmit={handleSubmit} />
    </ERPFormDialog>
  );
}
