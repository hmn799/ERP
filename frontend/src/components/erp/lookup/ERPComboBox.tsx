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

export interface ComboBoxOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: ComboBoxOption[];
  placeholder: string;
  className?: string;

  onSelect(value: string): void;

  /*
   * Fires once a value is actually chosen (Enter on a highlighted
   * option, or a click) - lets the natural cursor flow continue
   * into the next field, same as every other field on this screen.
   */
  onAdvance?(): void;
}

/*
 * A keyboard-searchable dropdown that stands in for a native
 * <select> wherever the natural cursor flow needs to drive it with
 * Enter. A native select can't be told to open its popup from
 * script, so intercepting Enter on one to "advance" the flow (as
 * this screen's header used to) means the operator's first Enter
 * press skips straight past the field without ever seeing its
 * options. Here, Enter is a deliberate two-step gesture instead:
 * pressed while closed, it opens the list; pressed again (after
 * arrowing or typing to narrow it down) it commits the highlighted
 * option and advances - the browsing step is never skipped.
 */
const ERPComboBox = forwardRef<
  HTMLInputElement,
  Props
>(function ERPComboBox(
  {
    value,
    options,
    placeholder,
    className,
    onSelect,
    onAdvance,
  },
  forwardedRef,
) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  useImperativeHandle(
    forwardedRef,
    () => inputRef.current as HTMLInputElement,
  );

  const selectedLabel = useMemo(
    () =>
      options.find(
        (option) => option.value === value,
      )?.label ?? "",
    [options, value],
  );

  const [search, setSearch] = useState(
    selectedLabel,
  );

  const [open, setOpen] = useState(false);

  const [highlighted, setHighlighted] =
    useState(0);

  const [menu, setMenu] = useState({
    top: 0,
    left: 0,
    width: 240,
  });

  /*
   * onAdvance (below) focuses the NEXT field synchronously, inside
   * the same click/keydown handler that just selected an option
   * here. That focus() call fires this input's blur immediately -
   * before React has applied this render's state updates - so
   * onBlur's deferred reset would otherwise close over a stale,
   * pre-selection `selectedLabel` (e.g. "") and overwrite the
   * selection that only lands a moment later. Keeping the latest
   * label in a ref (always current, unlike the closure) means the
   * timeout reads the real value whenever it actually fires.
   */
  const selectedLabelRef = useRef(
    selectedLabel,
  );

  useEffect(() => {
    selectedLabelRef.current = selectedLabel;
  }, [selectedLabel]);

  /*
   * Keep the displayed text in sync with the selected option
   * whenever the field isn't actively being searched in.
   */
  useEffect(() => {
    if (!open) {
      setSearch(selectedLabel);
    }
  }, [selectedLabel, open]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query || search === selectedLabel) {
      return options;
    }

    return options.filter((option) =>
      option.label
        .toLowerCase()
        .includes(query),
    );
  }, [options, search, selectedLabel]);

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
      width: Math.max(rect.width, 240),
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

  function openMenu() {
    const currentIndex = filtered.findIndex(
      (option) => option.value === value,
    );

    setHighlighted(
      currentIndex >= 0 ? currentIndex : 0,
    );

    setOpen(true);
    positionMenu();
  }

  function selectOption(
    option: ComboBoxOption,
  ) {
    setSearch(option.label);
    setOpen(false);

    onSelect(option.value);
    onAdvance?.();
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (!open) {
        openMenu();
        return;
      }

      const choice = filtered[highlighted];

      if (choice) {
        selectOption(choice);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openMenu();
        return;
      }

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

      if (!open) {
        openMenu();
        return;
      }

      setHighlighted((current) =>
        Math.max(current - 1, 0),
      );

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setSearch(selectedLabel);
    }
  }

  const dropdown =
    open && typeof document !== "undefined"
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
                No matches.
              </div>
            )}

            {filtered.length > 0 && (
              <div className="max-h-72 overflow-y-auto">
                {filtered.map(
                  (option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`block w-full border-b border-gray-100 px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-gray-50 ${
                        index === highlighted
                          ? "bg-gray-100"
                          : ""
                      }`}
                      onClick={() =>
                        selectOption(option)
                      }
                    >
                      {option.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Input
        ref={inputRef}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        value={search}
        onFocus={(event) => {
          positionMenu();
          event.target.select();
        }}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            setSearch(selectedLabelRef.current);
          }, 150);
        }}
      />

      {dropdown}
    </>
  );
});

export default ERPComboBox;
