"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useSuppliers } from "../hooks/useSuppliers";
import SupplierTable from "../components/SupplierTable";
import SupplierDialog from "../components/SupplierDialog";

import supplierService from "@/services/supplier/supplier.service";

import { Supplier } from "../types/supplier.types";

export default function SuppliersPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useSuppliers();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<Supplier>();

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  async function deleteSupplier() {
    if (!selected) return;

    try {
      await supplierService.remove(
        selected.id,
      );

      toast.success("Supplier deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error(
        "Unable to delete supplier",
      );
    }
  }

  const filtered = data.filter(
    (x: Supplier) =>
      x.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      x.supplierCode
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search Suppliers..."
        onSearch={setSearch}
        addLabel="Add Supplier"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <SupplierTable
        data={filtered}
        loading={isLoading}
        onEdit={(supplier) => {
          setSelected(supplier);
          setDialogOpen(true);
        }}
        onDelete={(supplier) => {
          setSelected(supplier);
          setDeleteOpen(true);
        }}
      />

      <SupplierDialog
        open={dialogOpen}
        supplier={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Supplier"
        description={`Delete "${selected?.name}" ?`}
        onClose={() =>
          setDeleteOpen(false)
        }
        onConfirm={deleteSupplier}
      />
    </div>
  );
}