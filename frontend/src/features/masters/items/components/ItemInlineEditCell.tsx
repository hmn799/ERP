"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/*
 * Inline-editable table cells for the Items list - Category, Sub
 * Category, Brand, GST Slab, MRP, Purchase Rate, HSN, Min Qty, and
 * Reorder Qty can all be changed directly in the row, saving
 * immediately, without opening the Edit dialog. Native <select>/
 * <input> rather than the shadcn Select (a Radix popover) since a
 * table can have many rows and these need to stay lightweight.
 */

export interface InlineOption {
  id: string;
  name: string;
}

const controlClass =
  "w-full min-w-[8rem] rounded border bg-white px-2 py-1 text-sm outline-none focus:border-black disabled:opacity-50";

export function InlineSelectCell({
  value,
  options,
  allowEmpty,
  emptyLabel = "—",
  onSave,
}: {
  value: string;
  options: InlineOption[];
  allowEmpty?: boolean;
  emptyLabel?: string;
  onSave(nextValue: string): Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextValue = event.target.value;

    if (nextValue === value) {
      return;
    }

    setSaving(true);

    try {
      await onSave(nextValue);
    } catch (error) {
      console.error(
        "Failed to save field:",
        error,
      );

      toast.error(
        "Failed to save - please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={handleChange}
      className={controlClass}
    >
      {allowEmpty && (
        <option value="">{emptyLabel}</option>
      )}

      {options.map((option) => (
        <option
          key={option.id}
          value={option.id}
        >
          {option.name}
        </option>
      ))}
    </select>
  );
}

export function InlineInputCell({
  value,
  type = "text",
  onSave,
}: {
  value: string | number | null | undefined;
  type?: "text" | "number";
  onSave(nextValue: string): Promise<void>;
}) {
  const initial = String(value ?? "");

  const [local, setLocal] = useState(initial);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function commit() {
    if (local === initial) {
      return;
    }

    setSaving(true);

    try {
      await onSave(local);
    } catch (error) {
      console.error(
        "Failed to save field:",
        error,
      );

      toast.error(
        "Failed to save - please try again.",
      );

      setLocal(initial);
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type={type}
      value={local}
      disabled={saving}
      onChange={(event) =>
        setLocal(event.target.value)
      }
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          (
            event.target as HTMLInputElement
          ).blur();
        }
      }}
      className={`${controlClass} ${
        type === "number" ? "text-right" : ""
      }`}
    />
  );
}
