"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { SalesListItem } from "@/features/sales/types/sales.types";

function money(value: number | string) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface RecentBillsProps {
  bills: SalesListItem[];
}

export default function RecentBills({
  bills,
}: RecentBillsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bills</CardTitle>
      </CardHeader>

      <CardContent>
        {bills.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No sales yet.
          </div>
        ) : (
          <ul className="divide-y">
            {bills.map((bill) => (
              <li key={bill.id}>
                <Link
                  href={`/sales/view/${bill.id}`}
                  className="flex items-center justify-between py-2 text-sm hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">
                      {bill.billNo}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {bill.customer?.name ??
                        "Cash Sale"}{" "}
                      ·{" "}
                      {new Date(
                        bill.billDate,
                      ).toLocaleDateString(
                        "en-IN",
                      )}
                    </div>
                  </div>

                  <div className="font-semibold">
                    ₹{money(bill.finalPayable)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
