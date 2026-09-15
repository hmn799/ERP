"use client";

interface ERPDateFilterProps {
  value: string;

  onChange(value: string): void;

  label?: string;
}

export default function ERPDateFilter({
  value,
  onChange,
  label,
}: ERPDateFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}

      <input
        type="date"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="
          h-10
          w-full
          rounded-md
          border
          bg-background
          px-3
          text-sm
          outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />
    </div>
  );
}