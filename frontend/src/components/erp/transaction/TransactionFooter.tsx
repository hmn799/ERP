"use client";

import { TransactionTotals } from "./transaction.types";

interface Props {
  totals: TransactionTotals;
}

export default function TransactionFooter({
  totals,
}: Props) {
  return (
    <div className="border-t bg-muted/30 p-4">

      <div className="grid grid-cols-5 gap-4 text-sm">

        <div>
          <div className="text-muted-foreground">
            Total Qty
          </div>

          <div className="font-semibold">
            {totals.totalQty}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">
            Free Qty
          </div>

          <div className="font-semibold">
            {totals.totalFreeQty}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">
            Gross Amount
          </div>

          <div className="font-semibold">
            ₹ {totals.grossAmount.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">
            Discount
          </div>

          <div className="font-semibold">
            ₹ {totals.discountAmount.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">
            Net Amount
          </div>

          <div className="text-lg font-bold text-primary">
            ₹ {totals.netAmount.toFixed(2)}
          </div>
        </div>

      </div>

    </div>
  );
}