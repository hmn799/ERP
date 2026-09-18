"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { AccountGroupNatureType } from "../types/account-group.types";

export interface AccountGroupFormValues {
  name: string;
  natureType: AccountGroupNatureType;
  description?: string;
}

interface AccountGroupFormProps {
  defaultValues?: AccountGroupFormValues;

  loading?: boolean;

  onSubmit(values: AccountGroupFormValues): void;
}

const NATURE_TYPE_OPTIONS: {
  value: AccountGroupNatureType;
  label: string;
}[] = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

export default function AccountGroupForm({
  defaultValues,
  loading,
  onSubmit,
}: AccountGroupFormProps) {
  const [name, setName] = useState("");

  const [natureType, setNatureType] =
    useState<AccountGroupNatureType>("ASSET");

  const [description, setDescription] =
    useState("");

  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
      setNatureType(defaultValues.natureType);
      setDescription(
        defaultValues.description ?? "",
      );
    } else {
      setName("");
      setNatureType("ASSET");
      setDescription("");
    }
  }, [defaultValues]);

  return (
    <form
      id="account-group-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
          natureType,
          description: description || undefined,
        });
      }}
    >
      <div className="space-y-2">
        <Label required>Group Name</Label>

        <Input
          value={name}
          disabled={loading}
          placeholder="e.g. Sundry Debtors"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label required>Nature</Label>

        <select
          value={natureType}
          disabled={loading}
          onChange={(e) =>
            setNatureType(
              e.target.value as AccountGroupNatureType,
            )
          }
          className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
        >
          {NATURE_TYPE_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>

        <Input
          value={description}
          disabled={loading}
          placeholder="Optional notes"
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />
      </div>
    </form>
  );
}
