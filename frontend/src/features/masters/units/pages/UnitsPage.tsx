"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";
import ImportMastersDialog from "@/components/erp/crud/ImportMastersDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

import { useUnits } from "../hooks/useUnits";
import UnitTable from "../components/UnitTable";
import UnitDialog from "../components/UnitDialog";

import unitService from "@/services/unit/unit.service";
import { Unit } from "../types/unit.types";

export default function UnitsPage() {
  const { data = [], isLoading, refetch } = useUnits();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<Unit>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [importOpen, setImportOpen] = useState(false);

  async function deleteUnit() {
    if (!selected) return;

    try {
      await unitService.remove(selected.id);

      toast.success("Unit deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete unit");
    }
  }

  const filtered = data.filter((x: Unit) =>
    x.name.toLowerCase().includes(search.toLowerCase()) ||
    x.shortName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Units..."
        onSearch={setSearch}
        addLabel="Add Unit"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
        extraActions={
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        }
      />

      <UnitTable
        data={filtered}
        loading={isLoading}
        onEdit={(u) => {
          setSelected(u);
          setDialogOpen(true);
        }}
        onDelete={(u) => {
          setSelected(u);
          setDeleteOpen(true);
        }}
      />

      <UnitDialog
  open={dialogOpen}
  unit={selected}
  onOpenChange={setDialogOpen}
  onSuccess={refetch}
/>

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Unit"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteUnit}
      />

      <ImportMastersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Units"
        entity="unit"
        templateHeaders={["Name", "Short Name"]}
        templateSample={["Pieces", "PCS"]}
        onSuccess={refetch}
      />

    </div>
  );
}