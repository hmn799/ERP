"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { ROUTES } from "@/config/routes";

import { useStockTransfers } from "../hooks/useStockTransfers";
import StockTransferTable from "../components/StockTransferTable";

import StockTransferService, {
  type StockTransferListItem,
} from "@/services/stock-transfer/stock-transfer.service";

export default function StockTransferListPage() {
  const router = useRouter();

  const { data = [], isLoading, refetch } = useStockTransfers();

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<StockTransferListItem>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteTransfer() {
    if (!selected) return;

    try {
      await StockTransferService.remove(selected.id);

      toast.success("Stock transfer deleted.");

      setDeleteOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Unable to delete this transfer.",
      );
    }
  }

  const filtered = data.filter(
    (transfer) =>
      transfer.transferNo.toLowerCase().includes(search.toLowerCase()) ||
      transfer.fromWarehouse.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      transfer.toWarehouse.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search by transfer no or warehouse..."
        onSearch={setSearch}
        addLabel="New Transfer"
        onRefresh={refetch}
        onAdd={() => router.push(`${ROUTES.STOCK_TRANSFER}/new`)}
      />

      <StockTransferTable
        data={filtered}
        loading={isLoading}
        onDelete={(transfer) => {
          setSelected(transfer);
          setDeleteOpen(true);
        }}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Stock Transfer"
        description={`Delete transfer "${selected?.transferNo}"? This reverses the stock movement.`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteTransfer}
      />
    </div>
  );
}
