"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { usePriceLists } from "../hooks/usePriceLists";
import PriceListTable from "../components/PriceListTable";
import PriceListDialog from "../components/PriceListDialog";

import priceListService from "@/services/price-list/price-list.service";

import { PriceList } from "../types/price-list.types";

export default function PriceListsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = usePriceLists();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] = useState<PriceList>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deletePriceList() {
    if (!selected) return;

    try {
      await priceListService.remove(selected.id);

      toast.success("Price List deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error("Unable to delete Price List");
    }
  }

  const filtered = data.filter(
    (x: PriceList) =>
      x.code.toLowerCase().includes(search.toLowerCase()) ||
      x.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Price Lists..."
        onSearch={setSearch}
        addLabel="Add Price List"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <PriceListTable
        data={filtered}
        loading={isLoading}
        onEdit={(priceList) => {
          setSelected(priceList);
          setDialogOpen(true);
        }}
        onDelete={(priceList) => {
          setSelected(priceList);
          setDeleteOpen(true);
        }}
      />

      <PriceListDialog
        open={dialogOpen}
        priceList={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Price List"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deletePriceList}
      />

    </div>
  );
}