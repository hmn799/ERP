"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

import type { ItemLookup } from "@/features/purchase/services/purchase.service";
import { itemMatchesQuery } from "@/lib/item-search";

interface ItemSearchAutocompleteProps {
  items: ItemLookup[];
  selectedLabel?: string;
  disabled?: boolean;
  placeholder?: string;
  onSelect(item: ItemLookup): void;
}

/*
 * Generic item search/select box used wherever a transaction grid
 * needs to pick an item by name/code. Renders its results dropdown
 * `fixed` (not `absolute`), positioned from the input's own
 * bounding rect - several of these live inside a horizontally-
 * scrollable table (ERPTransactionGrid's overflow-x-auto wrapper),
 * which would otherwise clip an absolutely-positioned dropdown
 * before a real mouse user could ever see it.
 */
export default function ItemSearchAutocomplete({
  items,
  selectedLabel,
  disabled,
  placeholder = "Search item by name or code...",
  onSelect,
}: ItemSearchAutocompleteProps) {
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

    return items
      .filter((item) => itemMatchesQuery(item, query))
      .slice(0, 10);
  }, [items, query]);

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
        placeholder={placeholder}
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
              No items found.
            </div>
          )}

          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-gray-50 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(item);
                setOpen(false);
                setQuery("");
              }}
            >
              <div className="font-medium">
                {item.itemCode} - {item.name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
