"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

export interface PriceListFormValues {
  code: string;
  name: string;
  description: string;
  priority: number;
  isDefault: boolean;
  isActive: boolean;
}

interface PriceListFormProps {
  defaultValues?: PriceListFormValues;

  loading?: boolean;

  onSubmit(values: PriceListFormValues): void;
}

export default function PriceListForm({
  defaultValues,
  loading,
  onSubmit,
}: PriceListFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("1");

  useEffect(() => {
    if (defaultValues) {
      setCode(defaultValues.code);
      setName(defaultValues.name);
      setDescription(defaultValues.description ?? "");
      setPriority(String(defaultValues.priority));
    } else {
      setCode("");
      setName("");
      setDescription("");
      setPriority("1");
    }
  }, [defaultValues]);

  return (
    <form
      id="price-list-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          code,
          name,
          description,
          priority: Number(priority),
          isDefault: defaultValues?.isDefault ?? false,
          isActive: defaultValues?.isActive ?? true,
        });
      }}
    >
      <Input
        placeholder="Code"
        value={code}
        disabled={loading}
        onChange={(e) => setCode(e.target.value)}
      />

      <Input
        placeholder="Name"
        value={name}
        disabled={loading}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        placeholder="Description"
        value={description}
        disabled={loading}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        type="number"
        placeholder="Priority"
        value={priority}
        disabled={loading}
        onChange={(e) => setPriority(e.target.value)}
      />
    </form>
  );
}