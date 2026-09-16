"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type { DashboardSummary } from "@/services/reports/reports.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface StatCardProps {
  label: string;
  value: string;
  tone?: "default" | "warning";
}

function StatCard({
  label,
  value,
  tone = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>

        <div
          className={`mt-1 text-2xl font-bold ${
            tone === "warning"
              ? "text-amber-600"
              : ""
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  summary: DashboardSummary;
}

export default function DashboardStats({
  summary,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <StatCard
        label="Total Sales"
        value={`₹${money(summary.totalSales)}`}
      />

      <StatCard
        label="Total Purchase"
        value={`₹${money(summary.totalPurchase)}`}
      />

      <StatCard
        label="Total Profit"
        value={`₹${money(summary.totalProfit)}`}
      />

      <StatCard
        label="Customer Outstanding"
        value={`₹${money(
          summary.customerOutstanding,
        )}`}
      />

      <StatCard
        label="Supplier Outstanding"
        value={`₹${money(
          summary.supplierOutstanding,
        )}`}
      />

      <StatCard
        label="Stock Items"
        value={summary.stockItems.toLocaleString(
          "en-IN",
        )}
      />

      <StatCard
        label="Stock Quantity"
        value={summary.stockQty.toLocaleString(
          "en-IN",
        )}
      />

      <StatCard
        label="Dead Stock Items"
        value={summary.deadStockItems.toLocaleString(
          "en-IN",
        )}
        tone={
          summary.deadStockItems > 0
            ? "warning"
            : "default"
        }
      />
    </div>
  );
}
