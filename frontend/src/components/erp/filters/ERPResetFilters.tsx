"use client";

interface ERPResetFiltersProps {
  onClick(): void;
}

export default function ERPResetFilters({
  onClick,
}: ERPResetFiltersProps) {
  return (
    <button
      onClick={onClick}
      className="
        h-10
        rounded-md
        border
        px-4
        text-sm
        transition
        hover:bg-muted
      "
    >
      Reset Filters
    </button>
  );
}