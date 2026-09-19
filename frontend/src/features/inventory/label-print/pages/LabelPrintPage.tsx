"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ItemSearchAutocomplete from "@/components/erp/lookup/ItemSearchAutocomplete";

import {
  getItemLookup,
  type ItemLookup,
} from "@/features/purchase/services/purchase.service";

import LabelPrintSheet, {
  type LabelQueueItem,
} from "../components/LabelPrintSheet";

export default function LabelPrintPage() {
  const [items, setItems] = useState<ItemLookup[]>([]);
  const [queue, setQueue] = useState<LabelQueueItem[]>([]);
  const [copies, setCopies] = useState("1");

  useEffect(() => {
    getItemLookup().then(setItems);
  }, []);

  function handleSelect(item: ItemLookup) {
    const barcode = item.barcode || item.itemCode;
    const qty = Math.max(1, Number(copies) || 1);

    setQueue((prev) => {
      const existingIndex = prev.findIndex(
        (row) => row.itemCode === item.itemCode,
      );

      if (existingIndex >= 0) {
        return prev.map((row, i) =>
          i === existingIndex
            ? { ...row, copies: row.copies + qty }
            : row,
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          itemCode: item.itemCode,
          name: item.name,
          barcode,
          price: Number(item.mrp || 0),
          copies: qty,
        },
      ];
    });
  }

  function updateCopies(id: string, value: string) {
    const qty = Math.max(0, Number(value) || 0);

    setQueue((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, copies: qty } : row,
      ),
    );
  }

  function removeRow(id: string) {
    setQueue((prev) => prev.filter((row) => row.id !== id));
  }

  const totalLabels = queue.reduce(
    (sum, row) => sum + row.copies,
    0,
  );

  function handlePrint() {
    if (totalLabels === 0) {
      toast.error("Add at least one label to print.");
      return;
    }

    window.print();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Print Barcode Labels</h1>
        <p className="text-sm text-muted-foreground">
          Search an item, set how many stickers you need, and print a
          40mm x 25mm label sheet.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-background p-4 shadow-sm">
        <div className="w-80 space-y-2">
          <Label>Item</Label>
          <ItemSearchAutocomplete
            items={items}
            onSelect={handleSelect}
          />
        </div>

        <div className="w-28 space-y-2">
          <Label>Copies</Label>
          <Input
            type="number"
            min="1"
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-white">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Barcode</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="w-28 px-4 py-3 text-right">Copies</th>
              <th className="w-16 px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {queue.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No items added yet.
                </td>
              </tr>
            )}

            {queue.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  {row.itemCode} - {row.name}
                </td>
                <td className="px-4 py-3">{row.barcode}</td>
                <td className="px-4 py-3 text-right">
                  &#8377;{row.price.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min="0"
                    className="text-right"
                    value={row.copies}
                    onChange={(e) =>
                      updateCopies(row.id, e.target.value)
                    }
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total labels: <span className="font-medium">{totalLabels}</span>
        </div>

        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Labels
        </Button>
      </div>

      <LabelPrintSheet items={queue} />
    </div>
  );
}
