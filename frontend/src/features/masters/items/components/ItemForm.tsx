"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import categoryService from "@/services/category/category.service";
import subCategoryService from "@/services/sub-category/sub-category.service";
import brandService from "@/services/brand/brand.service";
import gstSlabService from "@/services/gst-slab/gst-slab.service";
import unitService from "@/services/unit/unit.service";

interface Option {
  id: string;
  name: string;
}

export interface ItemFormValues {
  name: string;

  hsnCode?: string;

  barcode?: string;

  categoryId: string;

  subCategoryId?: string;

  brandId?: string;

  gstSlabId: string;

  baseUnitId: string;

  purchaseUnitId: string;

  saleUnitId: string;

  mrp: number;

  purchaseRate: number;

  minQty?: number;

  reorderQty?: number;

  isActive: boolean;
}

interface Props {
  defaultValues?: ItemFormValues;

  loading?: boolean;

  onSubmit(values: ItemFormValues): void;
}

export default function ItemForm({
  defaultValues,
  loading,
  onSubmit,
}: Props) {
  const [categories, setCategories] = useState<Option[]>([]);
  const [subCategories, setSubCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [gstSlabs, setGstSlabs] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);

  const [name, setName] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [barcode, setBarcode] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");

  const [gstSlabId, setGstSlabId] = useState("");

  const [baseUnitId, setBaseUnitId] = useState("");
  const [purchaseUnitId, setPurchaseUnitId] = useState("");
  const [saleUnitId, setSaleUnitId] = useState("");

  const [mrp, setMrp] = useState("");

  const [purchaseRate, setPurchaseRate] = useState("");

  const [minQty, setMinQty] = useState("0");

  const [reorderQty, setReorderQty] = useState("0");

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
    subCategoryService.getAll().then(setSubCategories);
    brandService.getAll().then(setBrands);
    gstSlabService.getAll().then(setGstSlabs);
    unitService.getAll().then(setUnits);
  }, []);

  useEffect(() => {
    if (!defaultValues) return;

    setName(defaultValues.name);
    setHsnCode(defaultValues.hsnCode ?? "");
    setBarcode(defaultValues.barcode ?? "");

    setCategoryId(defaultValues.categoryId);
    setSubCategoryId(defaultValues.subCategoryId ?? "");
    setBrandId(defaultValues.brandId ?? "");

    setGstSlabId(defaultValues.gstSlabId);

    setBaseUnitId(defaultValues.baseUnitId);
    setPurchaseUnitId(defaultValues.purchaseUnitId);
    setSaleUnitId(defaultValues.saleUnitId);

    setMrp(String(defaultValues.mrp));

    setPurchaseRate(
      String(defaultValues.purchaseRate),
    );

    setMinQty(
      String(defaultValues.minQty ?? 0),
    );

    setReorderQty(
      String(defaultValues.reorderQty ?? 0),
    );

    setIsActive(defaultValues.isActive);
  }, [defaultValues]);

  return (
    <form
      id="item-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
          hsnCode,
          barcode,

          categoryId,
          subCategoryId,
          brandId,

          gstSlabId,

          baseUnitId,
          purchaseUnitId,
          saleUnitId,

          mrp: Number(mrp),

          purchaseRate:
            Number(purchaseRate),

          minQty: Number(minQty),

          reorderQty: Number(reorderQty),

          isActive,
        });
      }}
    >
      <div className="space-y-2">
        <Label required>Item Name</Label>
        <Input
          value={name}
          disabled={loading}
          placeholder="Item Name"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>HSN Code</Label>
        <Input
          value={hsnCode}
          disabled={loading}
          placeholder="HSN Code"
          onChange={(e) => setHsnCode(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Barcode</Label>
        <Input
          value={barcode}
          disabled={loading}
          placeholder="Barcode"
          onChange={(e) => setBarcode(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label required>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>

          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sub Category</Label>
        <Select
          value={subCategoryId}
          onValueChange={setSubCategoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sub Category" />
          </SelectTrigger>

          <SelectContent>
            {subCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Brand</Label>
        <Select value={brandId} onValueChange={setBrandId}>
          <SelectTrigger>
            <SelectValue placeholder="Brand" />
          </SelectTrigger>

          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label required>GST Slab</Label>
        <Select
          value={gstSlabId}
          onValueChange={setGstSlabId}
        >
          <SelectTrigger>
            <SelectValue placeholder="GST Slab" />
          </SelectTrigger>

          <SelectContent>
            {gstSlabs.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label required>Base Unit</Label>
        <Select
          value={baseUnitId}
          onValueChange={setBaseUnitId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Base Unit" />
          </SelectTrigger>

          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label required>Purchase Unit</Label>
        <Select
          value={purchaseUnitId}
          onValueChange={setPurchaseUnitId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Purchase Unit" />
          </SelectTrigger>

          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label required>Sale Unit</Label>
        <Select
          value={saleUnitId}
          onValueChange={setSaleUnitId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sale Unit" />
          </SelectTrigger>

          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label required>MRP</Label>
        <Input
          type="number"
          value={mrp}
          placeholder="MRP"
          onChange={(e) => setMrp(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label required>Purchase Rate</Label>
        <Input
          type="number"
          value={purchaseRate}
          placeholder="Purchase Rate"
          onChange={(e) =>
            setPurchaseRate(e.target.value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Min Qty</Label>
        <Input
          type="number"
          value={minQty}
          placeholder="Min Qty"
          onChange={(e) =>
            setMinQty(e.target.value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Reorder Qty</Label>
        <Input
          type="number"
          value={reorderQty}
          placeholder="Reorder Qty"
          onChange={(e) =>
            setReorderQty(e.target.value)
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={isActive}
          onCheckedChange={(v) =>
            setIsActive(Boolean(v))
          }
        />

        <span>Active</span>
      </div>
    </form>
  );
}