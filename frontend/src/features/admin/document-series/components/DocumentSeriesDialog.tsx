"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { DocumentSeriesService } from "@/services/document-series/document-series.service";

import type { DocumentSeries } from "../types/document-series.types";
import DocumentSeriesForm, {
  DocumentSeriesFormValues,
} from "./DocumentSeriesForm";

interface DocumentSeriesDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  documentSeries?: DocumentSeries;

  onSuccess?(): void;
}

export default function DocumentSeriesDialog({
  open,
  onOpenChange,
  documentSeries,
  onSuccess,
}: DocumentSeriesDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: DocumentSeriesFormValues,
  ) {
    try {
      setLoading(true);

      if (documentSeries) {
        await DocumentSeriesService.update(
          documentSeries.id,
          values,
        );

        toast.success(
          "Document series updated successfully.",
        );
      } else {
        await DocumentSeriesService.create(values);

        toast.success(
          "Document series created successfully.",
        );
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to save document series.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={
        documentSeries
          ? "Edit Document Series"
          : "New Document Series"
      }
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "document-series-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <DocumentSeriesForm
        isEditMode={Boolean(documentSeries)}
        defaultValues={
          documentSeries
            ? {
                documentType:
                  documentSeries.documentType,
                name: documentSeries.name,
                prefix: documentSeries.prefix,
                suffix:
                  documentSeries.suffix ?? "",
                padding: documentSeries.padding,
                currentNumber:
                  documentSeries.currentNumber,
                resetYearly:
                  documentSeries.resetYearly,
                financialYear:
                  documentSeries.financialYear ??
                  "",
                isActive: documentSeries.isActive,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}
