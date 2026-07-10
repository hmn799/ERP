"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

export interface WarehouseFormValues {
  name: string;
}

interface WarehouseFormProps {
  defaultValues?: WarehouseFormValues;

  loading?: boolean;

  onSubmit(values: WarehouseFormValues): void;
}

export default function WarehouseForm({
  defaultValues,
  loading,
  onSubmit,
}: WarehouseFormProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
    } else {
      setName("");
    }
  }, [defaultValues]);

  return (
    <form
      id="warehouse-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
        });
      }}
    >
      <Input
        value={name}
        disabled={loading}
        placeholder="Warehouse Name"
        onChange={(e) => setName(e.target.value)}
      />
    </form>
  );
}