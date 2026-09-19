"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, TableProperties } from "lucide-react";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";
import ImportMastersDialog from "@/components/erp/crud/ImportMastersDialog";
import { Button } from "@/components/ui/button";

import { ROUTES } from "@/config/routes";

import { useOpeningStock } from "../hooks/useOpeningStock";
import OpeningStockTable from "../components/OpeningStockTable";
import OpeningStockDialog from "../components/OpeningStockDialog";

import OpeningStockService, {
  type OpeningStockEntry,
} from "@/services/opening-stock/opening-stock.service";

export default function OpeningStockPage() {
  const { data = [], isLoading, refetch } = useOpeningStock();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [selected, setSelected] = useState<OpeningStockEntry>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteEntry() {
    if (!selected) return;

    try {
      await OpeningStockService.remove(selected.id);

      toast.success("Opening stock entry deleted.");

      setDeleteOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to delete - some of this stock may already be sold or moved.",
      );
    }
  }

  const filtered = data.filter(
    (entry) =>
      entry.item.name.toLowerCase().includes(search.toLowerCase()) ||
      entry.item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      entry.warehouse.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search by item, code, or warehouse..."
        onSearch={setSearch}
        addLabel="Add Opening Stock"
        onRefresh={refetch}
        onAdd={() => setDialogOpen(true)}
        extraActions={
          <>
            <Button variant="outline" asChild>
              <Link href={ROUTES.OPENING_STOCK_BULK}>
                <TableProperties className="mr-2 h-4 w-4" />
                Bulk Entry
              </Link>
            </Button>

            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </>
        }
      />

      <OpeningStockTable
        data={filtered}
        loading={isLoading}
        onDelete={(entry) => {
          setSelected(entry);
          setDeleteOpen(true);
        }}
      />

      <OpeningStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Opening Stock Entry"
        description={`Delete opening stock for "${selected?.item.name}"?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteEntry}
      />

      <ImportMastersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Opening Stock"
        entity="opening-stock"
        templateHeaders={[
          "Item",
          "Warehouse",
          "Qty",
          "Purchase Rate",
          "Retail Rate",
          "Wholesale Rate",
          "Distributor Rate",
          "MRP",
          "Expiry Date",
          "Manufacturing Date",
          "Date",
          "Remarks",
        ]}
        templateSample={[
          "Surf Excel 1kg",
          "Main Warehouse",
          "100",
          "120",
          "150",
          "140",
          "130",
          "150",
          "",
          "",
          "",
          "",
        ]}
        helpText="Item can be the Item Name or Item Code; Warehouse must match an existing warehouse name exactly. Dates use YYYY-MM-DD and are optional."
        onSuccess={refetch}
      />
    </div>
  );
}
