"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import { useSchemeItems } from "../hooks/useSchemes";

import type {
  CreateSchemeDto,
  SchemeType,
} from "../types/scheme.types";

export type SchemeFormValues = CreateSchemeDto;

interface SchemeFormProps {
  defaultValues?: SchemeFormValues;

  loading?: boolean;

  onSubmit(values: SchemeFormValues): void;
}

const SCHEME_TYPES: {
  value: SchemeType;
  label: string;
  hint: string;
}[] = [
  {
    value: "QUANTITY",
    label: "Quantity (e.g. 10+1)",
    hint: "Every N units sold gives extra units of the same item free.",
  },
  {
    value: "FREE_ITEM",
    label: "Free item with another item",
    hint: "Buying N units of this item gives free units of a different item.",
  },
  {
    value: "DISCOUNT",
    label: "Discount %",
    hint: "A flat percentage off, applied automatically whenever this item is sold.",
  },
];

export default function SchemeForm({
  defaultValues,
  loading,
  onSubmit,
}: SchemeFormProps) {
  const { data: items = [] } = useSchemeItems();

  const [name, setName] = useState("");
  const [schemeType, setSchemeType] =
    useState<SchemeType>("QUANTITY");
  const [itemId, setItemId] = useState("");
  const [buyQty, setBuyQty] = useState("");
  const [freeQty, setFreeQty] = useState("");
  const [freeItemId, setFreeItemId] = useState("");
  const [discountPercent, setDiscountPercent] =
    useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
      setSchemeType(defaultValues.schemeType);
      setItemId(defaultValues.itemId);
      setBuyQty(
        defaultValues.buyQty !== undefined
          ? String(defaultValues.buyQty)
          : "",
      );
      setFreeQty(
        defaultValues.freeQty !== undefined
          ? String(defaultValues.freeQty)
          : "",
      );
      setFreeItemId(
        defaultValues.freeItemId ?? "",
      );
      setDiscountPercent(
        defaultValues.discountPercent !== undefined
          ? String(defaultValues.discountPercent)
          : "",
      );
      setIsActive(defaultValues.isActive ?? true);
    } else {
      setName("");
      setSchemeType("QUANTITY");
      setItemId("");
      setBuyQty("");
      setFreeQty("");
      setFreeItemId("");
      setDiscountPercent("");
      setIsActive(true);
    }
  }, [defaultValues]);

  return (
    <form
      id="scheme-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
          schemeType,
          itemId,
          buyQty:
            schemeType === "DISCOUNT"
              ? undefined
              : Number(buyQty) || undefined,
          freeQty:
            schemeType === "DISCOUNT"
              ? undefined
              : Number(freeQty) || undefined,
          freeItemId:
            schemeType === "FREE_ITEM"
              ? freeItemId
              : undefined,
          discountPercent:
            schemeType === "DISCOUNT"
              ? Number(discountPercent) || undefined
              : undefined,
          isActive,
        });
      }}
    >
      <Input
        value={name}
        disabled={loading}
        placeholder="Scheme name (e.g. Diwali 10+1)"
        onChange={(e) => setName(e.target.value)}
      />

      <div className="space-y-1">
        <select
          value={schemeType}
          disabled={loading}
          onChange={(e) =>
            setSchemeType(
              e.target.value as SchemeType,
            )
          }
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {SCHEME_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <p className="text-xs text-gray-500">
          {
            SCHEME_TYPES.find(
              (type) => type.value === schemeType,
            )?.hint
          }
        </p>
      </div>

      <select
        value={itemId}
        disabled={loading}
        onChange={(e) => setItemId(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">
          Select trigger item...
        </option>

        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.itemCode} - {item.name}
          </option>
        ))}
      </select>

      {(schemeType === "QUANTITY" ||
        schemeType === "FREE_ITEM") && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={buyQty}
            disabled={loading}
            placeholder="Buy qty (e.g. 10)"
            onChange={(e) => setBuyQty(e.target.value)}
          />

          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={freeQty}
            disabled={loading}
            placeholder="Free qty (e.g. 1)"
            onChange={(e) => setFreeQty(e.target.value)}
          />
        </div>
      )}

      {schemeType === "FREE_ITEM" && (
        <select
          value={freeItemId}
          disabled={loading}
          onChange={(e) =>
            setFreeItemId(e.target.value)
          }
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">
            Select free item...
          </option>

          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.itemCode} - {item.name}
            </option>
          ))}
        </select>
      )}

      {schemeType === "DISCOUNT" && (
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={discountPercent}
          disabled={loading}
          placeholder="Discount % (e.g. 10)"
          onChange={(e) =>
            setDiscountPercent(e.target.value)
          }
        />
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          disabled={loading}
          onChange={(e) =>
            setIsActive(e.target.checked)
          }
        />
        Active
      </label>
    </form>
  );
}
