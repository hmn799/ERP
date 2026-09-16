"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DashboardFastMovingItem } from "@/services/reports/reports.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface TopSellingItemsProps {
  items: DashboardFastMovingItem[];
}

export default function TopSellingItems({
  items,
}: TopSellingItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No sales yet.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li
                key={item.itemId}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {item.itemName}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {item.itemCode}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    ₹{money(item.salesValue)}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    x{item.qtySold}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
