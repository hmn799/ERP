"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

import customerService from "@/services/customer/customer.service";
import type { Customer } from "@/features/masters/customers/types/customer.types";

import SalesOrderService, {
  type CreateSalesOrderItemDto,
} from "@/services/sales-order/sales-order.service";

import SalesOrderItemAutocomplete from "./SalesOrderItemAutocomplete";

interface GridRow {
  id: string;
  itemId: string;
  itemLabel: string;
  qty: string;
  saleRate: string;
  discountPercent: string;
  gstPercent: string;
}

function emptyRow(): GridRow {
  return {
    id: crypto.randomUUID(),
    itemId: "",
    itemLabel: "",
    qty: "",
    saleRate: "",
    discountPercent: "0",
    gstPercent: "0",
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function netAmount(row: GridRow): number {
  const qty = Number(row.qty || 0);
  const rate = Number(row.saleRate || 0);
  const discount = Number(row.discountPercent || 0);
  const gst = Number(row.gstPercent || 0);

  const gross = qty * rate;
  const taxable = gross - gross * (discount / 100);

  return taxable + taxable * (gst / 100);
}

export default function SalesOrderGrid() {
  const router = useRouter();

  const [items, setItems] = useState<ItemLookup[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLookup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [expectedDate, setExpectedDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [rows, setRows] = useState<GridRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getItemLookup().then(setItems);
    getWarehouses().then((data) => {
      setWarehouses(data);
      if (data.length === 1) setWarehouseId(data[0].id);
    });
    customerService.getAll().then(setCustomers);
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
      saleRate: String(item.retailRate || item.mrp || 0),
      gstPercent: String(item.gstPercent ?? 0),
    });
  }

  async function handleSave() {
    if (!warehouseId) {
      toast.error("Select a warehouse.");
      return;
    }

    const validRows = rows.filter((row) => row.itemId);

    if (validRows.length === 0) {
      toast.error("Add at least one item.");
      return;
    }

    for (const row of validRows) {
      if (Number(row.qty || 0) <= 0) {
        toast.error(`Enter a quantity for ${row.itemLabel}.`);
        return;
      }
    }

    const items: CreateSalesOrderItemDto[] = validRows.map((row) => ({
      itemId: row.itemId,
      qtyOrdered: Number(row.qty || 0),
      saleRate: Number(row.saleRate || 0),
      discountPercent: Number(row.discountPercent || 0),
      gstPercent: Number(row.gstPercent || 0),
    }));

    try {
      setSaving(true);

      const order = await SalesOrderService.create({
        customerId: customerId || undefined,
        warehouseId,
        orderDate,
        expectedDate: expectedDate || undefined,
        remarks: remarks || undefined,
        items,
      });

      toast.success(`Sales order ${order.soNo} created.`);

      router.push(`/sales-order/view/${order.id}`);
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to create sales order.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-lg border bg-background p-4 shadow-sm md:grid-cols-3">
        <div className="space-y-2">
          <Label>Customer</Label>
          <select
            value={customerId}
            disabled={saving}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Walk-in / no customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerCode} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>Order Date</Label>
          <Input
            type="date"
            value={orderDate}
            disabled={saving}
            onChange={(e) => setOrderDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Expected Delivery</Label>
          <Input
            type="date"
            value={expectedDate}
            disabled={saving}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Remarks</Label>
          <Input
            value={remarks}
            disabled={saving}
            placeholder="Optional"
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>

      <ERPTransactionGrid title="Order Items" data={rows} onAddRow={addRow}>
        <thead className="border-b bg-white">
          <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            <th className="min-w-[260px] px-3 py-3 text-left">Item</th>
            <th className="w-24 px-3 py-3 text-right">Qty</th>
            <th className="w-24 px-3 py-3 text-right">Rate</th>
            <th className="w-24 px-3 py-3 text-right">Discount %</th>
            <th className="w-20 px-3 py-3 text-right">GST %</th>
            <th className="w-28 px-3 py-3 text-right">Net</th>
            <th className="w-16 px-3 py-3 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="border-b last:border-b-0">
              <td className="px-3 py-2">
                <SalesOrderItemAutocomplete
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
                  value={row.saleRate}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { saleRate: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.discountPercent}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { discountPercent: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-right"
                  value={row.gstPercent}
                  disabled={saving}
                  onChange={(e) =>
                    updateRow(index, { gstPercent: e.target.value })
                  }
                />
              </td>
              <td className="px-3 py-2 text-right text-sm">
                &#8377;{netAmount(row).toFixed(2)}
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
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Sales Order"}
        </Button>
      </div>
    </div>
  );
}
