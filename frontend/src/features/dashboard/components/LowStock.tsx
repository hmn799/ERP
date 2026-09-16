"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { LowStockItem } from "@/services/reports/reports.service";

interface LowStockProps {
  items: LowStockItem[];
}

export default function LowStock({
  items,
}: LowStockProps) {
  const top = items.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock</CardTitle>
      </CardHeader>

      <CardContent>
        {top.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nothing is running low.
          </div>
        ) : (
          <ul className="divide-y">
            {top.map((item) => (
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

                <div
                  className={`font-semibold ${
                    item.stock <= 0
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  {item.stock}
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > top.length && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            +{items.length - top.length} more items
            low on stock
          </div>
        )}
      </CardContent>
    </Card>
  );
}
