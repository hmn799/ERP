"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useBrands } from "../hooks/useBrands";
import BrandDialog from "../components/BrandDialog";
import { getBrandColumns } from "../components/BrandColumns";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import brandService from "@/services/brand/brand.service";
import type { Brand } from "../types/brand.types";

export default function BrandsPage() {
  const { data = [], isLoading, refetch } = useBrands();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<Brand>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteBrand() {
    if (!selected) return;

    try {
      await brandService.remove(selected.id);

      toast.success("Brand deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete brand");
    }
  }

  const filtered = data.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search Brands..."
        onSearch={setSearch}
        addLabel="Add Brand"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <ERPDataTable
        data={filtered}
        columns={getBrandColumns({
          onEdit: (brand) => {
            setSelected(brand);
            setDialogOpen(true);
          },
          onDelete: (brand) => {
            setSelected(brand);
            setDeleteOpen(true);
          },
        })}
      />

      <BrandDialog
        open={dialogOpen}
        brand={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Brand"
        description={`Delete "${selected?.name}"?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteBrand}
      />
    </div>
  );
}