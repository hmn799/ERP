"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GstSlabFormValues {
  name: string;
  percentage: number;
}

interface GstSlabFormProps {
  defaultValues?: GstSlabFormValues;

  loading?: boolean;

  onSubmit(values: GstSlabFormValues): void;
}

export default function GstSlabForm({
  defaultValues,
  loading,
  onSubmit,
}: GstSlabFormProps) {
  const [name, setName] = useState("");

  const [percentage, setPercentage] = useState("");

  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
      setPercentage(String(defaultValues.percentage));
    } else {
      setName("");
      setPercentage("");
    }
  }, [defaultValues]);

  return (
    <form
      id="gst-slab-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
          percentage: Number(percentage),
        });
      }}
    >
      <div className="space-y-2">
        <Label required>GST Name</Label>

        <Input
          value={name}
          disabled={loading}
          placeholder="GST Name (e.g. GST 18%)"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label required>GST Percentage</Label>

        <Input
          type="number"
          value={percentage}
          disabled={loading}
          placeholder="GST Percentage"
          onChange={(e) => setPercentage(e.target.value)}
        />
      </div>
    </form>
  );
}