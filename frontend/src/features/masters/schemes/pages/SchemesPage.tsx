"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useSchemes } from "../hooks/useSchemes";
import SchemeTable from "../components/SchemeTable";
import SchemeDialog from "../components/SchemeDialog";

import SchemeService from "@/services/scheme/scheme.service";

import { Scheme } from "../types/scheme.types";

export default function SchemesPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useSchemes();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<Scheme>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteScheme() {
    if (!selected) return;

    try {
      await SchemeService.remove(selected.id);

      toast.success("Scheme deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete scheme");
    }
  }

  const filtered = data.filter(
    (scheme: Scheme) =>
      scheme.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      scheme.item?.name
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search schemes..."
        onSearch={setSearch}
        addLabel="Add Scheme"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <SchemeTable
        data={filtered}
        loading={isLoading}
        onEdit={(scheme) => {
          setSelected(scheme);
          setDialogOpen(true);
        }}
        onDelete={(scheme) => {
          setSelected(scheme);
          setDeleteOpen(true);
        }}
      />

      <SchemeDialog
        open={dialogOpen}
        scheme={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Scheme"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteScheme}
      />
    </div>
  );
}
