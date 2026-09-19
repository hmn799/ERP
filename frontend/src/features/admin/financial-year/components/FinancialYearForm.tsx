"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CreateFinancialYearDto } from "@/services/financial-year/financial-year.service";

interface FinancialYearFormProps {
  loading?: boolean;
  onSubmit(values: CreateFinancialYearDto): void;
}

export default function FinancialYearForm({
  loading,
  onSubmit,
}: FinancialYearFormProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <form
      id="financial-year-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, startDate, endDate });
      }}
    >
      <div className="space-y-2">
        <Label required>Name</Label>
        <Input
          value={name}
          disabled={loading}
          placeholder="e.g. FY 2026-27"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            disabled={loading}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label required>End Date</Label>
          <Input
            type="date"
            value={endDate}
            disabled={loading}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
    </form>
  );
}
