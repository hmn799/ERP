"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ERPTransactionGrid from "@/components/erp/transaction/ERPTransactionGrid";

import {
  getItemLookup,
  getWarehouses,
  type ItemLookup,
  type WarehouseLookup,
} from "@/features/purchase/services/purchase.service";

import OpeningStockService, {
  type BulkOpeningStockResult,
  type CreateOpeningStockDto,
} from "@/services/opening-stock/opening-stock.service";

import ItemAutocomplete from "./ItemAutocomplete";

interface GridRow {
  id: string;
  itemId: string;
  itemLabel: string;
  qty: string;
  purchaseRate: string;
  retailRate: string;
  wholesaleRate: string;
  distributorRate: string;
  mrp: string;
  expiryDate: string;
  manufacturingDate: string;
}

function emptyRow(): GridRow {
  return {
    id: crypto.randomUUID(),
    itemId: "",
    itemLabel: "",
    qty: "",
    purchaseRate: "",
    retailRate: "",
    wholesaleRate: "",
    distributorRate: "",
    mrp: "",
    expiryDate: "",
    manufacturingDate: "",
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface OpeningStockBulkGridProps {
  onSaved?(): void;
}

export default function OpeningStockBulkGrid({
  onSaved,
}: OpeningStockBulkGridProps) {
  const [items, setItems] = useState<ItemLookup[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLookup[]>([]);

  const [warehouseId, setWarehouseId] = useState("");
  const [transactionDate, setTransactionDate] = useState(today());
  const [rows, setRows] = useState<GridRow[]>([emptyRow()]);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BulkOpeningStockResult | null>(null);

  useEffect(() => {
    getItemLookup().then(setItems);
    getWarehouses().then((data) => {
      setWarehouses(data);
      if (data.length === 1) setWarehouseId(data[0].id);
    });
  }, []);

  function updateRow(index: number, patch: Partial<GridRow>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemSelect(index: number, item: ItemLookup) {
    updateRow(index, {
      itemId: item.id,
      itemLabel: `${item.itemCode} - ${item.name}`,
      purchaseRate: String(item.purchaseRate ?? 0),
      retailRate: String(item.retailRate ?? 0),
      wholesaleRate: String(item.wholesaleRate ?? 0),
      distributorRate: String(item.distributorRate ?? 0),
      mrp: String(item.mrp ?? 0),
    });
  }

  async function handleSaveAll() {
    if (!warehouseId) {
      toast.error("Select a warehouse.");
      return;
    }

    const validRows = rows.filter((row) => row.itemId);

    if (validRows.length === 0) {
      toast.error("Add at least one item.");
      return;
    }

    const payload: CreateOpeningStockDto[] = validRows.map((row) => ({
      itemId: row.itemId,
      warehouseId,
      qty: Number(row.qty || 0),
      purchaseRate: Number(row.purchaseRate || 0),
      retailRate: Number(row.retailRate || 0),
      wholesaleRate: Number(row.wholesaleRate || 0),
      distributorRate: Number(row.distributorRate || 0),
      mrp: Number(row.mrp || 0),
      expiryDate: row.expiryDate || undefined,
      manufacturingDate: row.manufacturingDate || undefined,
      transactionDate: transactionDate || undefined,
    }));

    try {
      setSaving(true);

      const bulkResult = await OpeningStockService.bulkCreate(payload);

      setResult(bulkResult);

      if (bulkResult.successCount > 0) {
        onSaved?.();
      }

      if (bulkResult.errors.length === 0) {
        setRows([emptyRow()]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save opening stock rows.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-background p-4 shadow-sm">
        <div className="w-64 space-y-2">
          <Label required>Warehouse</Label>
          <select
            value={warehouseId}
            disabled={saving}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select warehouse...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-48 space-y-2">
          <Label>Transaction Date</Label>
          <Input
            type="date"
            value={transactionDate}
            disabled={saving}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </div>
      </div>

      <ERPTransactionGrid title="Opening Stock Items" data={rows} onAddRow={addRow}>
        <thead className="border-b bg-white">
          <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            <th className="min-w-[240px] px-3 py-3 text-left">Item</th>
            <th className="w-24 px-3 py-3 text-right">Qty</th>
            <th className="w-24 px-3 py-3 text-right">P.Rate</th>
            <th className="w-24 px-3 py-3 text-right">Retail</th>
            <th className="w-24 px-3 py-3 text-right">Wholesale</th>
            <th className="w-28 px-3 py-3 text-right">Distributor</th>
            <th className="w-24 px-3 py-3 text-right">MRP</th>
            <th className="w-36 px-3 py-3 text-left">Expiry</th>
            <th className="w-36 px-3 py-3 text-left">Mfg Date</th>
            <th className="w-16 px-3 py-3 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="border-b last:border-b-0">
              <td className="px-3 py-2">
                <ItemAutocomplete
                  items={items}
                  selectedLabel={row.itemLabel}
                  disabled={saving}
                  onSelect={(item) => handleItemSelect(index, item)}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.qty}
                  disabled={saving}
                  onChange={(e) => updateRow(index, { qty: e.target.value })}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.purchaseRate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { purchaseRate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.retailRate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { retailRate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.wholesaleRate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { wholesaleRate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.distributorRate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { distributorRate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.mrp}
                  disabled={saving}
                  onChange={(e) => updateRow(index, { mrp: e.target.value })}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="date"
                  value={row.expiryDate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { expiryDate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="date"
                  value={row.manufacturingDate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { manufacturingDate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2 text-center">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  disabled={saving || rows.length === 1}
                  onClick={() => removeRow(index)}
                >
                  &times;
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </ERPTransactionGrid>

      <div className="flex justify-end">
        <Button disabled={saving} onClick={handleSaveAll}>
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {result && (
        <div className="space-y-2 rounded-lg border bg-background p-4 shadow-sm">
          <div className="text-sm">
            <span className="font-medium text-green-700">
              {result.successCount} of {result.total} rows saved
              successfully.
            </span>

            {result.errors.length > 0 && (
              <span className="text-red-600">
                {" "}
                {result.errors.length} row
                {result.errors.length === 1 ? "" : "s"} failed.
              </span>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
              {result.errors.map((error) => (
                <div key={error.row} className="text-red-600">
                  Row {error.row}: {error.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
