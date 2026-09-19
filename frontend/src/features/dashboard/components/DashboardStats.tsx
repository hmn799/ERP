"use client";

import {
  TrendingUp,
  ShoppingCart,
  PiggyBank,
  Users,
  Truck,
  Package,
  Boxes,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { cn } from "@/lib/utils";

import type { DashboardSummary } from "@/services/reports/reports.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Tone = "primary" | "success" | "warning" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: Tone;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>

          <div className="mt-0.5 truncate text-2xl font-bold">
            {value}
          </div>
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
        icon={TrendingUp}
        tone="primary"
        label="Total Sales"
        value={`₹${money(summary.totalSales)}`}
      />

      <StatCard
        icon={ShoppingCart}
        tone="neutral"
        label="Total Purchase"
        value={`₹${money(summary.totalPurchase)}`}
      />

      <StatCard
        icon={PiggyBank}
        tone="success"
        label="Total Profit"
        value={`₹${money(summary.totalProfit)}`}
      />

      <StatCard
        icon={Users}
        tone="neutral"
        label="Customer Outstanding"
        value={`₹${money(
          summary.customerOutstanding,
        )}`}
      />

      <StatCard
        icon={Truck}
        tone="neutral"
        label="Supplier Outstanding"
        value={`₹${money(
          summary.supplierOutstanding,
        )}`}
      />

      <StatCard
        icon={Package}
        tone="neutral"
        label="Stock Items"
        value={summary.stockItems.toLocaleString(
          "en-IN",
        )}
      />

      <StatCard
        icon={Boxes}
        tone="neutral"
        label="Stock Quantity"
        value={summary.stockQty.toLocaleString(
          "en-IN",
        )}
      />

      <StatCard
        icon={AlertTriangle}
        tone={
          summary.deadStockItems > 0
            ? "warning"
            : "neutral"
        }
        label="Dead Stock Items"
        value={summary.deadStockItems.toLocaleString(
          "en-IN",
        )}
      />
    </div>
  );
}
