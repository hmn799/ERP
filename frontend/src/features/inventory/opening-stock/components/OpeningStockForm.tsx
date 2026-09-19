"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getItemLookup,
  getWarehouses,
  type ItemLookup,
  type WarehouseLookup,
} from "@/features/purchase/services/purchase.service";

import ItemAutocomplete from "./ItemAutocomplete";

import type { CreateOpeningStockDto } from "@/services/opening-stock/opening-stock.service";

interface OpeningStockFormProps {
  loading?: boolean;
  onSubmit(values: CreateOpeningStockDto): void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OpeningStockForm({
  loading,
  onSubmit,
}: OpeningStockFormProps) {
  const [items, setItems] = useState<ItemLookup[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLookup[]>([]);

  const [itemId, setItemId] = useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const [qty, setQty] = useState("");
  const [purchaseRate, setPurchaseRate] = useState("");
  const [retailRate, setRetailRate] = useState("");
  const [wholesaleRate, setWholesaleRate] = useState("");
  const [distributorRate, setDistributorRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [transactionDate, setTransactionDate] = useState(today());
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    getItemLookup().then(setItems);
    getWarehouses().then((data) => {
      setWarehouses(data);
      if (data.length === 1) setWarehouseId(data[0].id);
    });
  }, []);

  function handleItemSelect(item: ItemLookup) {
    setItemId(item.id);
    setItemLabel(`${item.itemCode} - ${item.name}`);
    setPurchaseRate(String(item.purchaseRate ?? 0));
    setRetailRate(String(item.retailRate ?? 0));
    setWholesaleRate(String(item.wholesaleRate ?? 0));
    setDistributorRate(String(item.distributorRate ?? 0));
    setMrp(String(item.mrp ?? 0));
  }

  return (
    <form
      id="opening-stock-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          itemId,
          warehouseId,
          qty: Number(qty),
          purchaseRate: Number(purchaseRate || 0),
          retailRate: Number(retailRate || 0),
          wholesaleRate: Number(wholesaleRate || 0),
          distributorRate: Number(distributorRate || 0),
          mrp: Number(mrp || 0),
          expiryDate: expiryDate || undefined,
          manufacturingDate: manufacturingDate || undefined,
          transactionDate: transactionDate || undefined,
          remarks: remarks || undefined,
        });
      }}
    >
      <div className="space-y-2">
        <Label required>Item</Label>
        <ItemAutocomplete
          items={items}
          selectedLabel={itemLabel}
          disabled={loading}
          onSelect={handleItemSelect}
        />
      </div>

      <div className="space-y-2">
        <Label required>Warehouse</Label>
        <select
          value={warehouseId}
          disabled={loading}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Quantity</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={qty}
            disabled={loading}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Transaction Date</Label>
          <Input
            type="date"
            value={transactionDate}
            disabled={loading}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Purchase Rate</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={purchaseRate}
            disabled={loading}
            onChange={(e) => setPurchaseRate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label required>MRP</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={mrp}
            disabled={loading}
            onChange={(e) => setMrp(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Retail Rate</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={retailRate}
            disabled={loading}
            onChange={(e) => setRetailRate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label required>Wholesale Rate</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={wholesaleRate}
            disabled={loading}
            onChange={(e) => setWholesaleRate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Distributor Rate</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={distributorRate}
            disabled={loading}
            onChange={(e) => setDistributorRate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Expiry Date</Label>
          <Input
            type="date"
            value={expiryDate}
            disabled={loading}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Manufacturing Date</Label>
          <Input
            type="date"
            value={manufacturingDate}
            disabled={loading}
            onChange={(e) => setManufacturingDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Remarks</Label>
          <Input
            value={remarks}
            disabled={loading}
            placeholder="Optional"
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>
    </form>
  );
}
