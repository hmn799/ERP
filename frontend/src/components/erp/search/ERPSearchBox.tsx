"use client";

interface ERPSearchBoxProps {
  value: string;

  onChange(value: string): void;

  placeholder?: string;
}

export default function ERPSearchBox({
  value,
  onChange,
  placeholder = "Search...",
}: ERPSearchBoxProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="
        h-10
        w-72
        rounded-md
        border
        px-3
        text-sm
        outline-none
        focus:ring-2
        focus:ring-blue-500
      "
    />
  );
}