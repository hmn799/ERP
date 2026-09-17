"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Input } from "@/components/ui/input";

import {
  BatchLookup,
  getBatchesByItem,
} from "@/features/purchase/services/purchase.service";

interface Props {
  itemId: string;
  index: number;

  value: string;

  onChange(value: string): void;
  onSelect(batch: BatchLookup): void;

  /*
   * Enter with the dropdown closed, or open with nothing matching
   * the typed text (a brand-new batch number) - continues the row's
   * flow onto Qty, same as a plain Enter always did before this
   * field grew a lookup.
   */
  onEnterAdvance(): void;
}

const ERPBatchLookup = forwardRef<
  HTMLInputElement,
  Props
>(function ERPBatchLookup(
  {
    itemId,
    index,
    value,
    onChange,
    onSelect,
    onEnterAdvance,
  },
  forwardedRef,
) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  useImperativeHandle(
    forwardedRef,
    () => inputRef.current as HTMLInputElement,
  );

  const [batches, setBatches] = useState<
    BatchLookup[]
  >([]);

  const [open, setOpen] = useState(false);

  const [highlighted, setHighlighted] =
    useState(0);

  const [menu, setMenu] = useState({
    top: 0,
    left: 0,
    width: 280,
  });

  /* -------------------------------------------------------
     LOAD BATCHES FOR THIS ITEM
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    if (!itemId) {
      setBatches([]);
      return;
    }

    getBatchesByItem(itemId)
      .then((data) => {
        if (!cancelled) {
          setBatches(data);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load batches for item:",
          error,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  /*
   * Barcode resolution focuses this field synchronously, in the
   * same handler that also sets the row's itemId - so by the time
   * that focus() call runs, this component is still rendering with
   * the OLD (empty) itemId prop, and the plain onFocus check below
   * sees nothing to look up. This effect re-checks once itemId
   * actually changes: if the field is (by then) the focused
   * element, open the dropdown the user would otherwise have to
   * click away and back into to see.
   */
  useEffect(() => {
    if (
      itemId &&
      document.activeElement ===
        inputRef.current
    ) {
      setHighlighted(0);
      setOpen(true);
      positionMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  /* -------------------------------------------------------
     FILTER BATCHES
  ------------------------------------------------------- */

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) {
      return batches;
    }

    return batches.filter((batch) =>
      batch.batchNo
        .toLowerCase()
        .includes(query),
    );
  }, [batches, value]);

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
      width: Math.max(rect.width, 280),
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    positionMenu();

    const update = () => positionMenu();

    window.addEventListener(
      "resize",
      update,
    );

    window.addEventListener(
      "scroll",
      update,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        update,
      );

      window.removeEventListener(
        "scroll",
        update,
        true,
      );
    };
  }, [open]);

  /* -------------------------------------------------------
     SELECT BATCH
  ------------------------------------------------------- */

  function selectBatch(
    batch: BatchLookup,
  ) {
    setOpen(false);
    onSelect(batch);
  }

  /* -------------------------------------------------------
     KEYBOARD
  ------------------------------------------------------- */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (open && filtered[highlighted]) {
        selectBatch(filtered[highlighted]);
        return;
      }

      setOpen(false);
      onEnterAdvance();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!itemId) {
        return;
      }

      setOpen(true);

      setHighlighted((current) =>
        Math.min(
          current + 1,
          filtered.length - 1,
        ),
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!itemId) {
        return;
      }

      setOpen(true);

      setHighlighted((current) =>
        Math.max(current - 1, 0),
      );

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  /* -------------------------------------------------------
     DROPDOWN
  ------------------------------------------------------- */

  const dropdown =
    open &&
    itemId &&
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
              event.preventDefault();
            }}
          >
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                No existing batches -
                this will create a new
                one.
              </div>
            )}

            {filtered.length > 0 && (
              <div className="max-h-72 overflow-y-auto">
                {filtered.map(
                  (batch, batchIndex) => (
                    <button
                      key={batch.id}
                      type="button"
                      className={`block w-full border-b border-gray-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-gray-50 ${
                        batchIndex ===
                        highlighted
                          ? "bg-gray-100"
                          : ""
                      }`}
                      onClick={() =>
                        selectBatch(batch)
                      }
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {batch.batchNo}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500">
                        Rate: ₹
                        {Number(
                          batch.purchaseRate,
                        ).toFixed(2)}{" "}
                        · MRP: ₹
                        {Number(
                          batch.mrp,
                        ).toFixed(2)}
                        {batch.expiryDate
                          ? ` · Exp: ${new Date(
                              batch.expiryDate,
                            ).toLocaleDateString()}`
                          : ""}
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
        data-row-index={index}
        data-field="batch"
        value={value}
        autoComplete="off"
        onFocus={(event) => {
          if (itemId) {
            setHighlighted(0);
            setOpen(true);
            positionMenu();
          }

          event.target.select();
        }}
        onChange={(event) => {
          onChange(event.target.value);

          if (itemId) {
            setHighlighted(0);
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          /*
           * Small delay allows a dropdown
           * click to complete before the
           * list disappears.
           */
          window.setTimeout(() => {
            setOpen(false);
          }, 150);
        }}
      />

      {dropdown}
    </>
  );
});

export default ERPBatchLookup;
