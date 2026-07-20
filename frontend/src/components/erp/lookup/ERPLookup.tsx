"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

import {
  LookupOption,
  LookupProps,
} from "./types";

export default function ERPLookup<
  T extends LookupOption,
>({
  value,
  items,
  loading = false,
  placeholder = "Search...",
  getSubtitle,
  onSearch,
  onSelect,
}: LookupProps<T>) {
  const [highlighted, setHighlighted] =
    useState(0);

  const inputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHighlighted(0);
  }, [items]);

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (!value.trim()) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();

        setHighlighted((prev) =>
          Math.min(prev + 1, items.length - 1),
        );

        break;

      case "ArrowUp":
        e.preventDefault();

        setHighlighted((prev) =>
          Math.max(prev - 1, 0),
        );

        break;

      case "Enter":
        if (items.length === 0) {
          return;
        }

        e.preventDefault();

        onSelect(items[highlighted]);

        break;

      case "Escape":
        e.preventDefault();

        onSearch("");

        inputRef.current?.blur();

        break;
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onSearch(e.target.value)
        }
        onKeyDown={handleKeyDown}
      />

      {value.trim() !== "" && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-white shadow-lg">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground">
              Loading...
            </div>
          )}

          {!loading &&
            items.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                No records found.
              </div>
            )}

          {!loading &&
            items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`flex w-full flex-col border-b px-3 py-2 text-left ${
                  highlighted === index
                    ? "bg-slate-200"
                    : "hover:bg-slate-100"
                }`}
                onMouseEnter={() =>
                  setHighlighted(index)
                }
                onClick={() =>
                  onSelect(item)
                }
              >
                <strong>
                  {item.code}
                </strong>

                <span>{item.name}</span>

                {getSubtitle && (
                  <span className="text-xs text-muted-foreground">
                    {getSubtitle(item)}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}