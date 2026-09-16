"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import {
  getItemLookup,
  ItemLookup,
} from "@/features/purchase/services/purchase.service";

import { itemMatchesQuery } from "@/lib/item-search";

interface Props {
  value: string;
  onSelect(item: ItemLookup): void;
}

export default function ERPItemLookup({
  value,
  onSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [allItems, setAllItems] = useState<ItemLookup[]>([]);
  const [search, setSearch] = useState(value);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [menu, setMenu] = useState({
    top: 0,
    left: 0,
    width: 280,
  });

  /* -------------------------------------------------------
     KEEP LOCAL SEARCH IN SYNC
  ------------------------------------------------------- */

  useEffect(() => {
    setSearch(value);
  }, [value]);

  /* -------------------------------------------------------
     LOAD ITEMS
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    getItemLookup()
      .then((items) => {
        if (!cancelled) {
          setAllItems(items);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load item lookup:",
          error,
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------------------------------
     FILTER ITEMS
  ------------------------------------------------------- */

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return [];
    }

    return allItems
      .filter((item) => itemMatchesQuery(item, search))
      .slice(0, 20);
  }, [allItems, search]);

  /* -------------------------------------------------------
     POSITION DROPDOWN
  ------------------------------------------------------- */

  function positionMenu() {
    const element = inputRef.current;

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    setMenu({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(
        rect.width,
        280,
      ),
    });
  }

  /* -------------------------------------------------------
     KEEP DROPDOWN ALIGNED
  ------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      return;
    }

    positionMenu();

    const updatePosition = () => {
      positionMenu();
    };

    window.addEventListener(
      "resize",
      updatePosition,
    );

    window.addEventListener(
      "scroll",
      updatePosition,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePosition,
      );

      window.removeEventListener(
        "scroll",
        updatePosition,
        true,
      );
    };
  }, [open, search]);

  /* -------------------------------------------------------
     SELECT ITEM
  ------------------------------------------------------- */

  function selectItem(
    item: ItemLookup,
  ) {
    setSearch(item.name);
    setOpen(false);

    onSelect(item);
  }

  /* -------------------------------------------------------
     KEYBOARD
  ------------------------------------------------------- */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (filtered.length > 0) {
        selectItem(filtered[0]);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      setOpen(false);

      return;
    }
  }

  /* -------------------------------------------------------
     DROPDOWN
     
     IMPORTANT:
     Render into document.body so the dropdown is NOT
     clipped by table/card overflow.
  ------------------------------------------------------- */

  const dropdown =
    open &&
    search.trim() !== "" &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="
              fixed
              z-[99999]
              overflow-hidden
              rounded-md
              border
              border-gray-200
              bg-white
              shadow-2xl
            "
            style={{
              top: menu.top,
              left: menu.left,
              width: menu.width,
            }}
            onMouseDown={(event) => {
              /*
               * Prevent input blur before
               * selection happens.
               */
              event.preventDefault();
            }}
          >
            {/* LOADING */}

            {loading && (
              <div className="px-4 py-3 text-sm text-gray-500">
                Loading items...
              </div>
            )}

            {/* NO RESULTS */}

            {!loading &&
              filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No items found.
                </div>
              )}

            {/* RESULTS */}

            {!loading &&
              filtered.length > 0 && (
                <div className="max-h-72 overflow-y-auto">
                  {filtered.map(
                    (item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="
                          block
                          w-full
                          border-b
                          border-gray-100
                          px-4
                          py-3
                          text-left
                          last:border-b-0
                          hover:bg-gray-50
                        "
                        onClick={() =>
                          selectItem(item)
                        }
                      >
                        {/* ITEM */}

                        <div className="font-semibold text-gray-900">
                          {item.itemCode}{" "}
                          -{" "}
                          {item.name}
                        </div>

                        {/* DETAILS */}

                        <div className="mt-0.5 text-xs text-gray-500">
                          Barcode:{" "}
                          {item.barcode ||
                            "-"}{" "}
                          · P.Rate: ₹
                          {Number(
                            item.purchaseRate ??
                              0,
                          ).toFixed(
                            2,
                          )}{" "}
                          · GST{" "}
                          {Number(
                            item.gstPercent ??
                              0,
                          )}
                          %
                        </div>
                      </button>
                    ),
                  )}
                </div>
              )}
          </div>,
          document.body,
        )
      : null;

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <>
      <Input
        ref={inputRef}
        value={search}
        placeholder="Search item..."
        autoComplete="off"
        onFocus={() => {
          if (search.trim()) {
            setOpen(true);
          }

          positionMenu();
        }}
        onChange={(event) => {
          const nextValue =
            event.target.value;

          setSearch(nextValue);

          setOpen(
            nextValue.trim() !== "",
          );
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          /*
           * Small delay allows dropdown
           * click to complete.
           */
          window.setTimeout(() => {
            setOpen(false);
          }, 150);
        }}
      />

      {dropdown}
    </>
  );
}