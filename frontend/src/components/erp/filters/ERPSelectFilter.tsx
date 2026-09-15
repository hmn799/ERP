"use client";

export interface ERPSelectOption {
  label: string;
  value: string;
}

interface ERPSelectFilterProps {
  value: string;

  onChange(value: string): void;

  options: ERPSelectOption[];

  placeholder?: string;

  width?: string;
}

export default function ERPSelectFilter({
  value,
  onChange,
  options,
  placeholder = "Select...",
  width = "w-full",
}: ERPSelectFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        h-10
        rounded-md
        border
        bg-background
        px-3
        text-sm
        outline-none
        focus:ring-2
        focus:ring-blue-500
        ${width}
      `}
    >
      <option value="">
        {placeholder}
      </option>

      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}