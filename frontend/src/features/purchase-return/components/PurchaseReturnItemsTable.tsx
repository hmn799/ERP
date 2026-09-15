"use client";

import {
  PurchaseReturnItem,
} from "../types/purchase-return.types";

interface Props {
  items: PurchaseReturnItem[];

  onQtyChange(
    index: number,
    value: number,
  ): void;
}

export default function PurchaseReturnItemsTable({
  items,
  onQtyChange,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">
          Purchase Return Items
        </h2>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">
              Item
            </th>

            <th className="p-2 text-left">
              Batch
            </th>

            <th className="p-2 text-right">
              Purchased
            </th>

            <th className="p-2 text-right">
              Returned
            </th>

            <th className="p-2 text-right">
              Available
            </th>

            <th className="p-2 text-right">
              P.Rate
            </th>

            <th className="p-2 text-right">
              GST
            </th>

            <th className="p-2 text-right">
              Return Qty
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map(
            (item, index) => (
              <tr
                key={`${item.itemId}-${item.batchId}`}
                className="border-t"
              >
                <td className="p-2">
                  <div className="font-medium">
                    {item.itemName}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {item.itemCode}
                  </div>
                </td>

                <td className="p-2">
                  {item.batchNo}
                </td>

                <td className="p-2 text-right">
                  {item.purchasedQty}
                </td>

                <td className="p-2 text-right">
                  {item.returnedQty}
                </td>

                <td className="p-2 text-right font-medium">
                  {item.availableQty}
                </td>

                <td className="p-2 text-right">
                  ₹
                  {item.purchaseRate.toFixed(
                    2,
                  )}
                </td>

                <td className="p-2 text-right">
                  {item.gstPercent}%
                </td>

                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={
                      item.availableQty
                    }
                    step="0.01"
                    value={
                      item.returnQty
                    }
                    onChange={(e) =>
                      onQtyChange(
                        index,
                        Number(
                          e.target.value,
                        ),
                      )
                    }
                    className="h-9 w-28 rounded-md border bg-background px-2 text-right"
                  />
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No items available for return.
        </div>
      )}
    </div>
  );
}