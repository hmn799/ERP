"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface RoleFormValues {
  name: string;
}

interface RoleFormProps {
  defaultValues?: RoleFormValues;

  loading?: boolean;

  onSubmit(values: RoleFormValues): void;
}

export default function RoleForm({
  defaultValues,
  loading,
  onSubmit,
}: RoleFormProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(defaultValues?.name ?? "");
  }, [defaultValues]);

  return (
    <form
      id="role-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({ name });
      }}
    >
      <div className="space-y-2">
        <Label required>Role Name</Label>

        <Input
          value={name}
          disabled={loading}
          placeholder="e.g. Cashier"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </form>
  );
}
