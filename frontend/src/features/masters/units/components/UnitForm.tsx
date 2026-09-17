"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Unit } from "../types/unit.types";

const schema = z.object({
  name: z
    .string()
    .min(1, "Unit name is required")
    .max(50),

  shortName: z
    .string()
    .min(1, "Short name is required")
    .max(10),
});

export type UnitFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Unit>;

  onSubmit(values: UnitFormValues): void;
}

export default function UnitForm({
  defaultValues,
  onSubmit,
}: Props) {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(schema),

    defaultValues: {
      name: "",
      shortName: "",
    },
  });

  useEffect(() => {
    if (!defaultValues) return;

    form.reset({
      name: defaultValues.name ?? "",
      shortName: defaultValues.shortName ?? "",
    });
  }, [defaultValues, form]);

  return (
    <form
      id="unit-form"
      className="space-y-5"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div>
        <Label required>Unit Name</Label>

        <Input
          {...form.register("name")}
        />

        <p className="mt-1 text-sm text-red-500">
          {form.formState.errors.name?.message}
        </p>
      </div>

      <div>
        <Label required>Short Name</Label>

        <Input
          {...form.register("shortName")}
        />

        <p className="mt-1 text-sm text-red-500">
          {form.formState.errors.shortName?.message}
        </p>
      </div>
    </form>
  );
}