"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DOCUMENT_TYPES } from "../types/document-series.types";

export interface DocumentSeriesFormValues {
  documentType: string;
  name: string;
  prefix: string;
  suffix?: string;
  padding: number;
  currentNumber: number;
  resetYearly: boolean;
  financialYear?: string;
  isActive: boolean;
}

interface DocumentSeriesFormProps {
  defaultValues?: DocumentSeriesFormValues;

  isEditMode?: boolean;

  loading?: boolean;

  onSubmit(values: DocumentSeriesFormValues): void;
}

const EMPTY: DocumentSeriesFormValues = {
  documentType: "PO",
  name: "",
  prefix: "",
  suffix: "",
  padding: 6,
  currentNumber: 0,
  resetYearly: false,
  financialYear: "",
  isActive: true,
};

export default function DocumentSeriesForm({
  defaultValues,
  isEditMode = false,
  loading,
  onSubmit,
}: DocumentSeriesFormProps) {
  const [values, setValues] =
    useState<DocumentSeriesFormValues>(EMPTY);

  useEffect(() => {
    setValues(defaultValues ?? EMPTY);
  }, [defaultValues]);

  return (
    <form
      id="document-series-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          ...values,
          suffix: values.suffix || undefined,
          financialYear:
            values.financialYear || undefined,
        });
      }}
    >
      <div className="space-y-2">
        <Label required>Document Type</Label>

        <select
          value={values.documentType}
          disabled={loading || isEditMode}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              documentType: e.target.value,
            }))
          }
          className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 disabled:bg-muted"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option
              key={type.value}
              value={type.value}
            >
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label required>Series Name</Label>

        <Input
          value={values.name}
          disabled={loading}
          placeholder="e.g. Sales Bill Series"
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              name: e.target.value,
            }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Prefix</Label>

          <Input
            value={values.prefix}
            disabled={loading}
            placeholder="e.g. SB"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                prefix: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Suffix</Label>

          <Input
            value={values.suffix}
            disabled={loading}
            placeholder="Optional"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                suffix: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Padding (digits)</Label>

          <Input
            type="number"
            min="1"
            value={values.padding}
            disabled={loading}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                padding: Number(e.target.value),
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label required>Current Number</Label>

          <Input
            type="number"
            min="0"
            value={values.currentNumber}
            disabled={loading}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                currentNumber: Number(
                  e.target.value,
                ),
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Financial Year</Label>

        <Input
          value={values.financialYear}
          disabled={loading}
          placeholder="e.g. 2026-27 (used when Reset Yearly is on)"
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              financialYear: e.target.value,
            }))
          }
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.resetYearly}
            disabled={loading}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                resetYearly: e.target.checked,
              }))
            }
          />
          Reset Yearly
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isActive}
            disabled={loading}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                isActive: e.target.checked,
              }))
            }
          />
          Active
        </label>
      </div>
    </form>
  );
}
