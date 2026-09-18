"use client";

import { useQuery } from "@tanstack/react-query";

import ReportsService from "@/services/reports/reports.service";
import { getSales } from "@/features/sales/services/sales.service";

import DashboardStats from "../components/DashboardStats";
import SalesChart from "../components/SalesChart";
import RecentBills from "../components/RecentBills";
import TopSellingItems from "../components/TopSellingItems";
import LowStock from "../components/LowStock";
import QuickAccess from "../components/QuickAccess";

export default function DashboardPage() {
  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: ReportsService.getDashboard,
  });

  const { data: trend = [] } = useQuery({
    queryKey: ["dashboard-sales-trend"],
    queryFn: () => ReportsService.getSalesTrend(14),
  });

  const { data: bills = [] } = useQuery({
    queryKey: ["dashboard-recent-bills"],
    queryFn: getSales,
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: ReportsService.getLowStockReport,
  });

  if (summaryLoading || !summary) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Live snapshot of sales, stock, and
          outstanding balances.
        </p>
      </div>

      <QuickAccess />

      <DashboardStats summary={summary} />

      <SalesChart data={trend} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentBills bills={bills.slice(0, 5)} />

        <TopSellingItems
          items={summary.fastMovingItems}
        />
      </div>

      <LowStock items={lowStock} />
    </div>
  );
}
