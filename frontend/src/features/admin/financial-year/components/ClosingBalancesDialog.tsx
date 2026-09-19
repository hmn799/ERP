"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { FinancialYear } from "@/services/financial-year/financial-year.service";

interface ClosingBalancesDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  financialYear?: FinancialYear;
}

export default function ClosingBalancesDialog({
  open,
  onOpenChange,
  financialYear,
}: ClosingBalancesDialogProps) {
  const balances = financialYear?.closingBalances ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !value && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {financialYear?.name} - Closing Balances
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 space-y-1 overflow-y-auto py-2 text-sm">
          {balances.length === 0 && (
            <p className="text-muted-foreground">
              No customer or supplier had a nonzero balance as of this
              year's end date.
            </p>
          )}

          {balances.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-1.5">Party</th>
                  <th className="py-1.5">Type</th>
                  <th className="py-1.5 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="py-1.5">{row.partyName}</td>
                    <td className="py-1.5">
                      {row.partyType === "CUSTOMER"
                        ? "Customer"
                        : "Supplier"}
                    </td>
                    <td className="py-1.5 text-right">
                      &#8377;{Number(row.closingBalance).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
