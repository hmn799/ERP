"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useDocumentSeries } from "../hooks/useDocumentSeries";
import DocumentSeriesTable from "../components/DocumentSeriesTable";
import DocumentSeriesDialog from "../components/DocumentSeriesDialog";

import documentSeriesService from "@/services/document-series/document-series.service";

import { DocumentSeries } from "../types/document-series.types";

export default function DocumentSeriesPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useDocumentSeries();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] =
    useState<DocumentSeries>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteDocumentSeries() {
    if (!selected) return;

    try {
      await documentSeriesService.remove(
        selected.id,
      );

      toast.success("Document series deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error(
        "Unable to delete document series",
      );
    }
  }

  const filtered = data.filter(
    (series: DocumentSeries) =>
      series.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      series.documentType
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Document Series
        </h1>

        <p className="text-sm text-muted-foreground">
          Configure the prefix, padding, and next number
          used when generating bill/order numbers.
        </p>
      </div>

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Document Series..."
        onSearch={setSearch}
        addLabel="Add Document Series"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <DocumentSeriesTable
        data={filtered}
        loading={isLoading}
        onEdit={(series) => {
          setSelected(series);
          setDialogOpen(true);
        }}
        onDelete={(series) => {
          setSelected(series);
          setDeleteOpen(true);
        }}
      />

      <DocumentSeriesDialog
        open={dialogOpen}
        documentSeries={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Document Series"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteDocumentSeries}
      />
    </div>
  );
}
