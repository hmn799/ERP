"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
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

  conversionFactor: number;

  mrp: number;

  purchaseRate: number;

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

  const [conversionFactor, setConversionFactor] = useState("1");

  const [mrp, setMrp] = useState("");

  const [purchaseRate, setPurchaseRate] = useState("");

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

    setConversionFactor(
      String(defaultValues.conversionFactor),
    );

    setMrp(String(defaultValues.mrp));

    setPurchaseRate(
      String(defaultValues.purchaseRate),
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

          conversionFactor:
            Number(conversionFactor),

          mrp: Number(mrp),

          purchaseRate:
            Number(purchaseRate),

          isActive,
        });
      }}
    >
      <Input
        value={name}
        disabled={loading}
        placeholder="Item Name"
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        value={hsnCode}
        disabled={loading}
        placeholder="HSN Code"
        onChange={(e) => setHsnCode(e.target.value)}
      />

      <Input
        value={barcode}
        disabled={loading}
        placeholder="Barcode"
        onChange={(e) => setBarcode(e.target.value)}
      />

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

      <Input
        type="number"
        value={conversionFactor}
        placeholder="Conversion Factor"
        onChange={(e) =>
          setConversionFactor(e.target.value)
        }
      />

      <Input
        type="number"
        value={mrp}
        placeholder="MRP"
        onChange={(e) => setMrp(e.target.value)}
      />

      <Input
        type="number"
        value={purchaseRate}
        placeholder="Purchase Rate"
        onChange={(e) =>
          setPurchaseRate(e.target.value)
        }
      />

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