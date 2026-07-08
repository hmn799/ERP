"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BrandFormValues {
  name: string;
}

interface BrandFormProps {
  defaultValues?: BrandFormValues;

  loading?: boolean;

  onSubmit(values: BrandFormValues): void;
}

export default function BrandForm({
  defaultValues,
  loading,
  onSubmit,
}: BrandFormProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
    }
  }, [defaultValues]);

  return (
    <form
      id="brand-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
        });
      }}
    >
      <div className="space-y-2">
        <Label>Brand Name</Label>

        <Input
          value={name}
          disabled={loading}
          placeholder="Enter Brand Name"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </form>
  );
}