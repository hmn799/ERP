"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ERPTransactionGrid from "@/components/erp/transaction/ERPTransactionGrid";

import {
  getWarehouses,
  type WarehouseLookup,
} from "@/features/purchase/services/purchase.service";

import { ROUTES } from "@/config/routes";

import StockTransferService, {
  type CreateStockTransferItemDto,
  type WarehouseStockRow,
} from "@/services/stock-transfer/stock-transfer.service";

import StockAvailabilityAutocomplete from "./StockAvailabilityAutocomplete";

interface GridRow {
  id: string;
  itemId: string;
  batchId: string;
  itemLabel: string;
  available: number;
  qty: string;
}

function emptyRow(): GridRow {
  return {
    id: crypto.randomUUID(),
    itemId: "",
    batchId: "",
    itemLabel: "",
    available: 0,
    qty: "",
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function StockTransferGrid() {
  const router = useRouter();

  const [warehouses, setWarehouses] = useState<WarehouseLookup[]>([]);
  const [stock, setStock] = useState<WarehouseStockRow[]>([]);

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferDate, setTransferDate] = useState(today());
  const [remarks, setRemarks] = useState("");

  const [rows, setRows] = useState<GridRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWarehouses().then(setWarehouses);
  }, []);

  useEffect(() => {
    if (!fromWarehouseId) {
      setStock([]);
      return;
    }

    StockTransferService.getWarehouseStock(fromWarehouseId).then(setStock);

    // Rows reference batches available in the *previous* source
    // warehouse - they no longer mean anything once it changes.
    setRows([emptyRow()]);
  }, [fromWarehouseId]);

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

  function handleStockSelect(index: number, row: WarehouseStockRow) {
    updateRow(index, {
      itemId: row.itemId,
      batchId: row.batchId,
      itemLabel: `${row.item.itemCode} - ${row.item.name}`,
      available: row.quantity,
    });
  }

  async function handleSave() {
    if (!fromWarehouseId) {
      toast.error("Select the source warehouse.");
      return;
    }

    if (!toWarehouseId) {
      toast.error("Select the destination warehouse.");
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error("Source and destination warehouse must be different.");
      return;
    }

    const validRows = rows.filter((row) => row.itemId && row.batchId);

    if (validRows.length === 0) {
      toast.error("Add at least one item to transfer.");
      return;
    }

    for (const row of validRows) {
      const qty = Number(row.qty || 0);

      if (qty <= 0) {
        toast.error(`Enter a quantity for ${row.itemLabel}.`);
        return;
      }

      if (qty > row.available) {
        toast.error(
          `Only ${row.available} available for ${row.itemLabel}.`,
        );
        return;
      }
    }

    const items: CreateStockTransferItemDto[] = validRows.map((row) => ({
      itemId: row.itemId,
      batchId: row.batchId,
      qty: Number(row.qty || 0),
    }));

    try {
      setSaving(true);

      const transfer = await StockTransferService.create({
        transferDate,
        fromWarehouseId,
        toWarehouseId,
        remarks: remarks || undefined,
        items,
      });

      toast.success(`Stock transfer ${transfer.transferNo} saved.`);

      router.push(ROUTES.STOCK_TRANSFER);
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to save stock transfer.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-lg border bg-background p-4 shadow-sm md:grid-cols-4">
        <div className="space-y-2">
          <Label required>From Warehouse</Label>
          <select
            value={fromWarehouseId}
            disabled={saving}
            onChange={(e) => setFromWarehouseId(e.target.value)}
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

        <div className="space-y-2">
          <Label required>To Warehouse</Label>
          <select
            value={toWarehouseId}
            disabled={saving}
            onChange={(e) => setToWarehouseId(e.target.value)}
            className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select warehouse...</option>
            {warehouses
              .filter((w) => w.id !== fromWarehouseId)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Transfer Date</Label>
          <Input
            type="date"
            value={transferDate}
            disabled={saving}
            onChange={(e) => setTransferDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Remarks</Label>
          <Input
            value={remarks}
            disabled={saving}
            placeholder="Optional"
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>

      {!fromWarehouseId ? (
        <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground shadow-sm">
          Select a source warehouse to see what stock is available to
          transfer.
        </div>
      ) : (
        <ERPTransactionGrid title="Items to Transfer" data={rows} onAddRow={addRow}>
          <thead className="border-b bg-white">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              <th className="min-w-[260px] px-3 py-3 text-left">Item / Batch</th>
              <th className="w-24 px-3 py-3 text-right">Available</th>
              <th className="w-28 px-3 py-3 text-right">Qty to Transfer</th>
              <th className="w-16 px-3 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">
                  <StockAvailabilityAutocomplete
                    rows={stock}
                    selectedLabel={row.itemLabel}
                    disabled={saving}
                    onSelect={(stockRow) =>
                      handleStockSelect(index, stockRow)
                    }
                  />
                  {row.batchId && (
                    <div className="mt-1 text-xs text-gray-500">
                      Batch:{" "}
                      {
                        stock.find((s) => s.batchId === row.batchId)?.batch
                          .batchNo
                      }
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-sm text-gray-600">
                  {row.itemId ? row.available : "-"}
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
      )}

      <div className="flex justify-end">
        <Button disabled={saving || !fromWarehouseId} onClick={handleSave}>
          {saving ? "Saving..." : "Save Transfer"}
        </Button>
      </div>
    </div>
  );
}
