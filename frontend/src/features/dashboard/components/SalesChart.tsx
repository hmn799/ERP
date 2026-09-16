"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { SalesTrendPoint } from "@/services/reports/reports.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short" },
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SalesTrendPoint }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-medium">
        {new Date(point.date).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        )}
      </div>

      <div className="mt-0.5 text-muted-foreground">
        ₹{money(point.sales)}
      </div>
    </div>
  );
}

interface SalesChartProps {
  data: SalesTrendPoint[];
}

export default function SalesChart({
  data,
}: SalesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Sales - Last {data.length} Days
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-muted-foreground/20"
              />

              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: "currentColor",
                }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  fill: "currentColor",
                  opacity: 0.06,
                }}
              />

              <Bar
                dataKey="sales"
                fill="currentColor"
                className="text-foreground"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
