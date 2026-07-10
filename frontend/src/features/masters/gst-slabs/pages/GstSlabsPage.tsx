"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useGstSlabs } from "../hooks/useGstSlabs";
import GstSlabTable from "../components/GstSlabTable";
import GstSlabDialog from "../components/GstSlabDialog";

import gstSlabService from "@/services/gst-slab/gst-slab.service";

import { GstSlab } from "../types/gst-slab.types";

export default function GstSlabsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useGstSlabs();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<GstSlab>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteGstSlab() {
    if (!selected) return;

    try {
      await gstSlabService.remove(selected.id);

      toast.success("GST Slab deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete GST Slab");
    }
  }

  const filtered = data.filter(
    (x: GstSlab) =>
      x.name.toLowerCase().includes(search.toLowerCase()) ||
      String(x.percentage).includes(search),
  );

  return (
    <div className="space-y-6">

      <ERPToolbar
        search={search}
        searchPlaceholder="Search GST Slabs..."
        onSearch={setSearch}
        addLabel="Add GST Slab"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <GstSlabTable
        data={filtered}
        loading={isLoading}
        onEdit={(gst) => {
          setSelected(gst);
          setDialogOpen(true);
        }}
        onDelete={(gst) => {
          setSelected(gst);
          setDeleteOpen(true);
        }}
      />

      <GstSlabDialog
        open={dialogOpen}
        gstSlab={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete GST Slab"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteGstSlab}
      />

    </div>
  );
}