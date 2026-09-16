"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import AnalyticsService, {
  CategoryPerformanceRow,
  ReorderRecommendation,
  StockVelocityRow,
} from "@/services/analytics/analytics.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function classificationVariant(value: string) {
  if (value === "DEAD") return "destructive" as const;
  if (value === "FAST") return "default" as const;
  return "secondary" as const;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

const velocityColumns: ColumnDef<StockVelocityRow>[] = [
  { accessorKey: "itemCode", header: "Item Code" },
  { accessorKey: "itemName", header: "Item Name" },
  { accessorKey: "categoryName", header: "Category" },
  { accessorKey: "currentStock", header: "Current Stock" },
  {
    accessorKey: "qtySoldLast90Days",
    header: "Sold (90d)",
  },
  {
    id: "daysOfCover",
    header: "Days of Cover",
    cell: ({ row }) =>
      row.original.daysOfCover === null
        ? "—"
        : row.original.daysOfCover,
  },
  {
    accessorKey: "classification",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={classificationVariant(
          row.original.classification,
        )}
      >
        {row.original.classification}
      </Badge>
    ),
  },
];

const reorderColumns: ColumnDef<ReorderRecommendation>[] = [
  { accessorKey: "itemCode", header: "Item Code" },
  { accessorKey: "itemName", header: "Item Name" },
  { accessorKey: "categoryName", header: "Category" },
  { accessorKey: "currentStock", header: "Current Stock" },
  {
    accessorKey: "avgDailySales",
    header: "Avg Daily Sales",
  },
  {
    id: "daysOfCover",
    header: "Days of Cover",
    cell: ({ row }) =>
      row.original.daysOfCover === null
        ? "—"
        : row.original.daysOfCover,
  },
  {
    accessorKey: "recommendedQty",
    header: "Recommended Qty",
    cell: ({ row }) => (
      <span className="font-semibold">
        {row.original.recommendedQty}
      </span>
    ),
  },
];

const categoryColumns: ColumnDef<CategoryPerformanceRow>[] = [
  { accessorKey: "categoryName", header: "Category" },
  { accessorKey: "itemCount", header: "Items" },
  { accessorKey: "qtySold", header: "Qty Sold" },
  {
    accessorKey: "salesValue",
    header: "Sales Value",
    cell: ({ row }) =>
      `₹${money(row.original.salesValue)}`,
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }) =>
      `₹${money(row.original.profit)}`,
  },
  {
    accessorKey: "marginPercent",
    header: "Margin %",
    cell: ({ row }) =>
      `${row.original.marginPercent}%`,
  },
];

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={
        positive
          ? "text-sm font-medium text-emerald-600"
          : "text-sm font-medium text-destructive"
      }
    >
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState("velocity");

  const { data: velocity = [], isLoading: velocityLoading } =
    useQuery({
      queryKey: ["analytics", "stock-velocity"],
      queryFn: AnalyticsService.stockVelocity,
    });

  const {
    data: reorder = [],
    isLoading: reorderLoading,
  } = useQuery({
    queryKey: ["analytics", "reorder"],
    queryFn: AnalyticsService.reorderRecommendations,
  });

  const { data: forecast, isLoading: forecastLoading } =
    useQuery({
      queryKey: ["analytics", "forecast"],
      queryFn: () => AnalyticsService.salesForecast(14, 60),
    });

  const {
    data: category = [],
    isLoading: categoryLoading,
  } = useQuery({
    queryKey: ["analytics", "category-performance"],
    queryFn: () =>
      AnalyticsService.categoryPerformance(30),
  });

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ["analytics", "trend"],
    queryFn: () => AnalyticsService.trend(30),
  });

  const chartData = forecast
    ? [
        ...forecast.history.map((point) => ({
          date: point.date,
          actual: point.actual,
          projected: null as number | null,
        })),
        ...forecast.forecast.map((point) => ({
          date: point.date,
          actual: null as number | null,
          projected: point.projected,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Advanced Analytics
        </h1>

        <p className="text-sm text-muted-foreground">
          Stock velocity, reorder recommendations, sales
          forecast, category performance, and trend
          analysis.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="velocity">
            Stock Velocity
          </TabsTrigger>
          <TabsTrigger value="reorder">
            Reorder
          </TabsTrigger>
          <TabsTrigger value="forecast">
            Sales Forecast
          </TabsTrigger>
          <TabsTrigger value="category">
            Category Performance
          </TabsTrigger>
          <TabsTrigger value="trend">
            Trend
          </TabsTrigger>
        </TabsList>

        <TabsContent value="velocity">
          <ERPDataTable
            columns={velocityColumns}
            data={velocity}
            loading={velocityLoading}
            emptyMessage="No items found."
          />
        </TabsContent>

        <TabsContent value="reorder">
          <ERPDataTable
            columns={reorderColumns}
            data={reorder}
            loading={reorderLoading}
            emptyMessage="Nothing needs reordering right now."
          />
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Next 14 Days (Linear Trend)
              </CardTitle>
            </CardHeader>

            <CardContent>
              {forecastLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <span>
                      Method: {forecast?.method}
                    </span>
                    <span>
                      Projected total (14d): ₹
                      {money(
                        forecast?.projectedTotal ?? 0,
                      )}
                    </span>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={shortDate}
                          fontSize={12}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip
                          labelFormatter={(value) =>
                            shortDate(String(value))
                          }
                          formatter={(value) =>
                            `₹${money(Number(value))}`
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          name="Actual"
                          stroke="var(--color-chart-1, #2563eb)"
                          dot={false}
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="projected"
                          name="Projected"
                          stroke="var(--color-chart-2, #f97316)"
                          strokeDasharray="5 5"
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category">
          <ERPDataTable
            columns={categoryColumns}
            data={category}
            loading={categoryLoading}
            emptyMessage="No category sales in this period."
          />
        </TabsContent>

        <TabsContent value="trend">
          {trendLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : trend ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Sales ({trend.periodDays}d)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    ₹{money(trend.current.salesValue)}
                  </div>
                  <GrowthBadge
                    value={trend.growth.salesValue}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Gross Profit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    ₹{money(trend.current.grossProfit)}
                  </div>
                  <GrowthBadge
                    value={trend.growth.grossProfit}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    ₹{money(trend.current.purchaseValue)}
                  </div>
                  <GrowthBadge
                    value={trend.growth.purchaseValue}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    {trend.current.billCount}
                  </div>
                  <GrowthBadge
                    value={trend.growth.billCount}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Active Customers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    {trend.current.customerCount}
                  </div>
                  <GrowthBadge
                    value={trend.growth.customerCount}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
