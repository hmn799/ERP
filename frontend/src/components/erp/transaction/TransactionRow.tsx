"use client";

import { useRef } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ERPItemLookup from "../lookup/ERPItemLookup";
import { ItemLookup } from "@/features/purchase/services/purchase.service";

import {
  TransactionMode,
  TransactionRowModel,
} from "./transaction.types";

interface Props {
  row: TransactionRowModel;
  index: number;
  mode: TransactionMode;

  onChange: (
    index: number,
    field: keyof TransactionRowModel,
    value: string | number,
  ) => void;

  onItemSelected?(
    index: number,
    item: ItemLookup,
  ): void;

  onDelete(index: number): void;
}

function focusAndSelect(
  ref: React.RefObject<HTMLInputElement | null>,
) {
  window.setTimeout(() => {
    ref.current?.focus();
    ref.current?.select();
  }, 0);
}

function focusPurchaseSearchField() {
  window.setTimeout(() => {
    const search = document.querySelector(
      'input[aria-label="Scan barcode or search item"]',
    ) as HTMLInputElement | null;

    if (search) {
      search.focus();
      search.select();
    }
  }, 0);
}

export default function TransactionRow({
  row,
  index,
  mode,
  onChange,
  onItemSelected,
  onDelete,
}: Props) {
  const batchRef =
    useRef<HTMLInputElement>(null);

  const qtyRef =
    useRef<HTMLInputElement>(null);

  const freeQtyRef =
    useRef<HTMLInputElement>(null);

  const purchaseRateRef =
    useRef<HTMLInputElement>(null);

  const retailRateRef =
    useRef<HTMLInputElement>(null);

  const wholesaleRateRef =
    useRef<HTMLInputElement>(null);

  const distributorRateRef =
    useRef<HTMLInputElement>(null);

  const mrpRef =
    useRef<HTMLInputElement>(null);

  function handleItemSelected(
    item: ItemLookup,
  ) {
    onItemSelected?.(index, item);

    if (mode === "purchase") {
      focusAndSelect(batchRef);
    }
  }

  function handlePurchaseEnter(
    event: React.KeyboardEvent<HTMLInputElement>,
    next:
      | React.RefObject<HTMLInputElement | null>
      | "SEARCH",
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (next === "SEARCH") {
      focusPurchaseSearchField();
      return;
    }

    focusAndSelect(next);
  }

  return (
    <tr className="border-b">

      {/* BARCODE */}
      <td className="p-1">
        <Input
          value={row.barcode}
          onChange={(event) =>
            onChange(
              index,
              "barcode",
              event.target.value,
            )
          }
        />
      </td>

      {/* ITEM */}
      <td className="p-1">
        <ERPItemLookup
          value={row.itemName}
          onSelect={handleItemSelected}
        />
      </td>

      {/* BATCH */}
      <td className="p-1">
        <Input
          ref={batchRef}
          value={row.batchNo ?? ""}
          onChange={(event) =>
            onChange(
              index,
              "batchNo",
              event.target.value,
            )
          }
          onKeyDown={(event) =>
            mode === "purchase"
              ? handlePurchaseEnter(
                  event,
                  qtyRef,
                )
              : undefined
          }
        />
      </td>

      {/* QTY */}
      <td className="w-20 p-1">
        <Input
          ref={qtyRef}
          type="number"
          className="text-right"
          value={row.qty}
          onChange={(event) =>
            onChange(
              index,
              "qty",
              Number(event.target.value),
            )
          }
          onKeyDown={(event) =>
            mode === "purchase"
              ? handlePurchaseEnter(
                  event,
                  freeQtyRef,
                )
              : undefined
          }
        />
      </td>

      {/* FREE */}
      <td className="w-20 p-1">
        <Input
          ref={freeQtyRef}
          type="number"
          className="text-right"
          value={row.freeQty}
          onChange={(event) =>
            onChange(
              index,
              "freeQty",
              Number(event.target.value),
            )
          }
          onKeyDown={(event) =>
            mode === "purchase"
              ? handlePurchaseEnter(
                  event,
                  purchaseRateRef,
                )
              : undefined
          }
        />
      </td>

      {mode === "purchase" && (
        <>
          {/* PURCHASE RATE */}
          <td className="w-28 p-1">
            <Input
              ref={purchaseRateRef}
              type="number"
              className="text-right"
              value={row.purchaseRate}
              onChange={(event) =>
                onChange(
                  index,
                  "purchaseRate",
                  Number(event.target.value),
                )
              }
              onKeyDown={(event) =>
                handlePurchaseEnter(
                  event,
                  retailRateRef,
                )
              }
            />
          </td>

          {/* RETAIL */}
          <td className="w-28 p-1">
            <Input
              ref={retailRateRef}
              type="number"
              className="text-right"
              value={row.retailRate}
              onChange={(event) =>
                onChange(
                  index,
                  "retailRate",
                  Number(event.target.value),
                )
              }
              onKeyDown={(event) =>
                handlePurchaseEnter(
                  event,
                  wholesaleRateRef,
                )
              }
            />
          </td>

          {/* WHOLESALE */}
          <td className="w-28 p-1">
            <Input
              ref={wholesaleRateRef}
              type="number"
              className="text-right"
              value={row.wholesaleRate}
              onChange={(event) =>
                onChange(
                  index,
                  "wholesaleRate",
                  Number(event.target.value),
                )
              }
              onKeyDown={(event) =>
                handlePurchaseEnter(
                  event,
                  distributorRateRef,
                )
              }
            />
          </td>

          {/* DISTRIBUTOR */}
          <td className="w-28 p-1">
            <Input
              ref={distributorRateRef}
              type="number"
              className="text-right"
              value={row.distributorRate}
              onChange={(event) =>
                onChange(
                  index,
                  "distributorRate",
                  Number(event.target.value),
                )
              }
              onKeyDown={(event) =>
                handlePurchaseEnter(
                  event,
                  mrpRef,
                )
              }
            />
          </td>

          {/* MRP */}
          <td className="w-20 p-1">
            <Input
              ref={mrpRef}
              type="number"
              className="text-right"
              value={row.mrp}
              onChange={(event) =>
                onChange(
                  index,
                  "mrp",
                  Number(event.target.value),
                )
              }
              onKeyDown={(event) =>
                handlePurchaseEnter(
                  event,
                  "SEARCH",
                )
              }
            />
          </td>

          {/* GST */}
          <td className="w-16 p-1 text-center text-sm">
            {row.gstPercent}%
          </td>

          {/* NET */}
          <td className="w-28 p-1 text-right text-sm">
            ₹{Number(row.netAmount || 0).toFixed(2)}
          </td>
        </>
      )}

      {mode === "sale" && (
        <>
          {/* SALES RATE */}
          <td className="w-28 p-1">
            <Input
              type="number"
              className="text-right"
              value={row.purchaseRate ?? 0}
              onChange={(event) =>
                onChange(
                  index,
                 "purchaseRate",
                  Number(event.target.value),
                )
              }
            />
          </td>

          {/* SALES DISCOUNT */}
          <td className="w-24 p-1">
            <Input
              type="number"
              className="text-right"
              value={row.discountPercent}
              onChange={(event) =>
                onChange(
                  index,
                  "discountPercent",
                  Number(event.target.value),
                )
              }
            />
          </td>

          {/* SALES GST */}
          <td className="w-20 p-1 text-center text-sm">
            {row.gstPercent}%
          </td>

          {/* SALES AMOUNT */}
          <td className="w-28 p-1 text-right text-sm">
            ₹{Number(row.netAmount || 0).toFixed(2)}
          </td>
        </>
      )}

      {/* ACTION */}
      <td className="w-20 p-1 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Remove
        </Button>
      </td>

    </tr>
  );
}