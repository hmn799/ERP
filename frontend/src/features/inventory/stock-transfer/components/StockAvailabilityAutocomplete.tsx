"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

import type { WarehouseStockRow } from "@/services/stock-transfer/stock-transfer.service";

interface StockAvailabilityAutocompleteProps {
  rows: WarehouseStockRow[];
  selectedLabel?: string;
  disabled?: boolean;
  onSelect(row: WarehouseStockRow): void;
}

function matches(row: WarehouseStockRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  return (
    row.item.itemCode.toLowerCase().includes(q) ||
    row.item.name.toLowerCase().includes(q) ||
    row.batch.batchNo.toLowerCase().includes(q)
  );
}

/*
 * Same fixed-position dropdown approach as Opening Stock's
 * ItemAutocomplete - this picker is also used inside a
 * horizontally-scrollable transaction grid, where an `absolute`
 * dropdown would be clipped by the grid's own overflow-x-auto wrapper
 * before a real mouse user could ever see it.
 */
export default function StockAvailabilityAutocomplete({
  rows,
  selectedLabel,
  disabled,
  onSelect,
}: StockAvailabilityAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    return rows.filter((row) => matches(row, query)).slice(0, 10);
  }, [rows, query]);

  useEffect(() => {
    if (!open) return;

    function updateRect() {
      const el = inputRef.current;
      if (!el) return;

      const box = el.getBoundingClientRect();

      setRect({ top: box.bottom, left: box.left, width: box.width });
    }

    updateRect();

    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={open ? query : (selectedLabel ?? "")}
        disabled={disabled}
        placeholder="Search item or batch..."
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && query.trim() && rect && (
        <div
          className="fixed z-50 max-h-56 overflow-auto rounded-md border bg-white shadow-lg"
          style={{ top: rect.top + 4, left: rect.left, width: rect.width }}
        >
          {results.length === 0 && (
            <div className="p-2 text-sm text-gray-500">
              No available stock matches.
            </div>
          )}

          {results.map((row) => (
            <button
              key={row.id}
              type="button"
              className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-gray-50 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(row);
                setOpen(false);
                setQuery("");
              }}
            >
              <div className="font-medium">
                {row.item.itemCode} - {row.item.name}
              </div>
              <div className="text-xs text-gray-500">
                Batch {row.batch.batchNo} · Available: {row.quantity}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
