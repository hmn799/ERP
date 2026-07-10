"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useWarehouses } from "../hooks/useWarehouses";
import WarehouseTable from "../components/WarehouseTable";
import WarehouseDialog from "../components/WarehouseDialog";

import warehouseService from "@/services/warehouse/warehouse.service";

import { Warehouse } from "../types/warehouse.types";

export default function WarehousesPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useWarehouses();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<Warehouse>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteWarehouse() {
    if (!selected) return;

    try {
      await warehouseService.remove(selected.id);

      toast.success("Warehouse deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete Warehouse");
    }
  }

  const filtered = data.filter((x: Warehouse) =>
    x.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Warehouses..."
        onSearch={setSearch}
        addLabel="Add Warehouse"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <WarehouseTable
        data={filtered}
        loading={isLoading}
        onEdit={(warehouse) => {
          setSelected(warehouse);
          setDialogOpen(true);
        }}
        onDelete={(warehouse) => {
          setSelected(warehouse);
          setDeleteOpen(true);
        }}
      />

      <WarehouseDialog
        open={dialogOpen}
        warehouse={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Warehouse"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteWarehouse}
      />

    </div>
  );
}