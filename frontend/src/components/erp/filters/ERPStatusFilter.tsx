"use client";

import ERPSelectFilter from "./ERPSelectFilter";

interface ERPStatusFilterProps {
  value: string;

  onChange(value: string): void;
}

export default function ERPStatusFilter({
  value,
  onChange,
}: ERPStatusFilterProps) {
  return (
    <ERPSelectFilter
      value={value}
      onChange={onChange}
      placeholder="All Status"

      options={[
        {
          label: "Active",
          value: "ACTIVE",
        },
        {
          label: "Cancelled",
          value: "CANCELLED",
        },
        {
          label: "Draft",
          value: "DRAFT",
        },
      ]}
    />
  );
}