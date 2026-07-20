"use client";

import { memo } from "react";

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

function TransactionRow({
  row,
  index,
  mode,
  onChange,
  onItemSelected,
  onDelete,
}: Props) {
  return (
    <tr className="border-b">
      <td className="p-1">
        <Input
          value={row.barcode}
          onChange={(e) =>
            onChange(index, "barcode", e.target.value)
          }
        />
      </td>

      <td className="p-1">
        <ERPItemLookup
          value={row.itemName}
          onSelect={(item) =>
            onItemSelected?.(index, item)
          }
        />
      </td>

      <td className="p-1">
        <Input
          value={row.batchNo ?? ""}
          onChange={(e) =>
            onChange(index, "batchNo", e.target.value)
          }
        />
      </td>

      <td className="w-20 p-1">
        <Input
          type="number"
          className="text-right"
          value={row.qty}
          onChange={(e) =>
            onChange(
              index,
              "qty",
              Number(e.target.value),
            )
          }
        />
      </td>

      <td className="w-20 p-1">
        <Input
          type="number"
          className="text-right"
          value={row.freeQty}
          onChange={(e) =>
            onChange(
              index,
              "freeQty",
              Number(e.target.value),
            )
          }
        />
      </td>

      {mode === "purchase" && (
        <>
          <td className="w-28 p-1">
            <Input
              type="number"
              className="text-right"
              value={row.purchaseRate}
              onChange={(e) =>
                onChange(
                  index,
                  "purchaseRate",
                  Number(e.target.value),
                )
              }
            />
          </td>

          <td className="w-28 p-1">
            <Input
              type="number"
              className="text-right"
              value={row.retailRate}
              onChange={(e) =>
                onChange(
                  index,
                  "retailRate",
                  Number(e.target.value),
                )
              }
            />
          </td>

          <td className="w-28 p-1">
            <Input
              type="number"
              className="text-right"
              value={row.wholesaleRate}
              onChange={(e) =>
                onChange(
                  index,
                  "wholesaleRate",
                  Number(e.target.value),
                )
              }
            />
          </td>

          <td className="w-28 p-1">
            <Input
              type="number"
              className="text-right"
              value={row.distributorRate}
              onChange={(e) =>
                onChange(
                  index,
                  "distributorRate",
                  Number(e.target.value),
                )
              }
            />
          </td>
        </>
      )}

      <td className="w-24 p-1">
        <Input
          type="number"
          className="text-right"
          value={row.mrp}
          onChange={(e) =>
            onChange(
              index,
              "mrp",
              Number(e.target.value),
            )
          }
        />
      </td>

      <td className="w-20 text-center">
        {row.gstPercent}%
      </td>

      <td className="w-32 text-right pr-3 font-medium">
        ₹ {row.netAmount.toFixed(2)}
      </td>

      <td className="w-20 p-1">
        <Button
          type="button"
          variant="destructive"
          onClick={() => onDelete(index)}
        >
          ✕
        </Button>
      </td>
    </tr>
  );
}

TransactionRow.displayName =
  "TransactionRow";

export default memo(TransactionRow);