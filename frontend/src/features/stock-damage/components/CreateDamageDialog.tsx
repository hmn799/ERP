"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import StockDamageService from "@/services/stock-damage/stock-damage.service";
import itemService from "@/services/item/item.service";
import batchService from "@/services/batch/batch.service";
import WarehouseService from "@/services/warehouse/warehouse.service";

interface CreateDamageDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSuccess(): void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function errorMessage(error: unknown, fallback: string) {
  const message = (
    error as {
      response?: { data?: { message?: string | string[] } };
    }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message[0] ?? fallback;
  return message ?? fallback;
}

export default function CreateDamageDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDamageDialogProps) {
  const [damageDate, setDamageDate] = useState(todayDate());
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["stock-damage", "warehouses"],
    queryFn: WarehouseService.getAll,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["stock-damage", "items"],
    queryFn: itemService.getAll,
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["stock-damage", "batches", itemId],
    queryFn: () => batchService.getByItem(itemId),
    enabled: !!itemId,
  });

  useEffect(() => {
    if (open) {
      setDamageDate(todayDate());
      setWarehouseId("");
      setItemId("");
      setBatchId("");
      setQty("");
      setReason("");
    }
  }, [open]);

  useEffect(() => {
    setBatchId("");
  }, [itemId]);

  async function handleSubmit() {
    if (!warehouseId || !itemId || !batchId) {
      toast.error("Select warehouse, item, and batch.");
      return;
    }

    const qtyNum = Number(qty);

    if (!qtyNum || qtyNum <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Enter a reason.");
      return;
    }

    try {
      setSaving(true);

      await StockDamageService.create({
        damageDate,
        warehouseId,
        itemId,
        batchId,
        qty: qtyNum,
        reason: reason.trim(),
      });

      toast.success("Stock write-off recorded.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        errorMessage(error, "Failed to record write-off."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title="Write Off Damaged Stock"
      loading={saving}
      onClose={() => onOpenChange(false)}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label required>Date</Label>
          <Input
            type="date"
            value={damageDate}
            disabled={saving}
            onChange={(e) => setDamageDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label required>Warehouse</Label>
          <select
            value={warehouseId}
            disabled={saving}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full rounded border bg-white px-2 py-2 text-sm"
          >
            <option value="">Select warehouse...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label required>Item</Label>
        <select
          value={itemId}
          disabled={saving}
          onChange={(e) => setItemId(e.target.value)}
          className="w-full rounded border bg-white px-2 py-2 text-sm"
        >
          <option value="">Select item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.itemCode} - {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label required>Batch</Label>
          <select
            value={batchId}
            disabled={saving || !itemId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full rounded border bg-white px-2 py-2 text-sm"
          >
            <option value="">
              {itemId ? "Select batch..." : "Select item first"}
            </option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batchNo}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label required>Qty</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={qty}
            disabled={saving}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label required>Reason</Label>
        <Textarea
          value={reason}
          disabled={saving}
          placeholder="e.g. Expired, broken in storage, water damage..."
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </ERPFormDialog>
  );
}
