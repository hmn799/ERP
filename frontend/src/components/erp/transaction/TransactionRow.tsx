"use client";

import { useRef } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ERPItemLookup from "../lookup/ERPItemLookup";
import ERPBatchLookup from "../lookup/ERPBatchLookup";
import {
  BatchLookup,
  ItemLookup,
} from "@/features/purchase/services/purchase.service";

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

  /*
   * Resolves a scanned/typed code against known items (primary or
   * alternate barcodes, or item code) - lets the row's own Barcode
   * cell drive item selection directly, purchase-mode only. Returns
   * every item that matches, since the same code can legitimately
   * belong to more than one item.
   */
  onResolveBarcode?(
    code: string,
  ): ItemLookup[];

  onBarcodeNotFound?(): void;

  /*
   * Fires instead of onItemSelected when a code resolves to more
   * than one item - the row itself has no picker UI, so this hands
   * the ambiguous code up to the grid's own search bar/dropdown for
   * the operator to disambiguate.
   */
  onBarcodeAmbiguous?(code: string): void;

  /*
   * Fires when an existing batch is picked from the Batch cell's
   * lookup (purchase mode only) - lets the grid reuse that batch's
   * own rates/MRP instead of whatever the item master currently
   * has, matching what "reusing a batch" should mean.
   */
  onBatchSelected?(
    index: number,
    batch: BatchLookup,
  ): void;

  /*
   * Fires when Enter is pressed on the last field of the row
   * (MRP) - lets the grid continue the flow onto the next row's
   * own Barcode cell (creating one if this was the last row),
   * so an operator can keep scanning/entering items back-to-back
   * without ever leaving the grid.
   */
  onRowComplete?(index: number): void;

  onDelete(index: number): void;
}

/*
 * Focuses synchronously, in the same tick as the keydown that
 * triggered it - every ref here targets an input that already
 * exists in the DOM (the whole row renders together up front), so
 * there's no need to wait a tick. A setTimeout/rAF delay here would
 * race against fast/scanner-speed typing: if the next character
 * arrives before the deferred focus() runs, it lands in the field
 * that's still focused instead of the one it was meant for.
 */
function focusAndSelect(
  ref: React.RefObject<HTMLInputElement | null>,
) {
  ref.current?.focus();
  ref.current?.select();
}

export default function TransactionRow({
  row,
  index,
  mode,
  onChange,
  onItemSelected,
  onResolveBarcode,
  onBarcodeNotFound,
  onBarcodeAmbiguous,
  onBatchSelected,
  onRowComplete,
  onDelete,
}: Props) {
  const barcodeRef =
    useRef<HTMLInputElement>(null);

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

  function handleBarcodeKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      mode !== "purchase" ||
      event.key !== "Enter" ||
      !onResolveBarcode
    ) {
      return;
    }

    event.preventDefault();

    const code = row.barcode?.trim();

    if (!code) {
      return;
    }

    const matches = onResolveBarcode(code);

    if (matches.length === 1) {
      handleItemSelected(matches[0]);
    } else if (matches.length > 1) {
      onBarcodeAmbiguous?.(code);
    } else {
      onBarcodeNotFound?.();
    }
  }

  function handlePurchaseEnter(
    event: React.KeyboardEvent<HTMLInputElement>,
    next: React.RefObject<HTMLInputElement | null>,
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    focusAndSelect(next);
  }

  function handleBatchSelected(
    batch: BatchLookup,
  ) {
    onBatchSelected?.(index, batch);
    focusAndSelect(qtyRef);
  }

  function handleRowCompleteKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    onRowComplete?.(index);
  }

  return (
    <tr className="border-b">

      {/* BARCODE */}
      <td className="p-1">
        <Input
          ref={barcodeRef}
          data-row-index={index}
          data-field="barcode"
          value={row.barcode}
          onChange={(event) =>
            onChange(
              index,
              "barcode",
              event.target.value,
            )
          }
          onKeyDown={handleBarcodeKeyDown}
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
        {mode === "purchase" ? (
          <ERPBatchLookup
            ref={batchRef}
            index={index}
            itemId={row.itemId}
            value={row.batchNo ?? ""}
            onChange={(value) =>
              onChange(
                index,
                "batchNo",
                value,
              )
            }
            onSelect={handleBatchSelected}
            onEnterAdvance={() =>
              focusAndSelect(qtyRef)
            }
          />
        ) : (
          <Input
            ref={batchRef}
            data-row-index={index}
            data-field="batch"
            value={row.batchNo ?? ""}
            onChange={(event) =>
              onChange(
                index,
                "batchNo",
                event.target.value,
              )
            }
          />
        )}
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
              onKeyDown={handleRowCompleteKeyDown}
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