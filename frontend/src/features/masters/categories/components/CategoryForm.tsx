"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CategoryFormValues {
  name: string;
}

interface CategoryFormProps {
  defaultValues?: CategoryFormValues;

  loading?: boolean;

  onSubmit(values: CategoryFormValues): void;
}

export default function CategoryForm({
  defaultValues,
  loading,
  onSubmit,
}: CategoryFormProps) {
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
      id="category-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
        });
      }}
    >
      <div className="space-y-2">
        <Label required>Category Name</Label>

        <Input
          value={name}
          disabled={loading}
          placeholder="Enter Category Name"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </form>
  );
}