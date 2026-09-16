"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import ReportsService from "@/services/reports/reports.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>

        <div className="mt-1 text-2xl font-bold">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GstReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "gst-summary"],
    queryFn: ReportsService.getGstSummary,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          GST Report
        </h1>

        <p className="text-sm text-muted-foreground">
          Combined GST liability across sales and
          purchases.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label="Taxable Amount"
              value={`₹${money(data.taxableAmount)}`}
            />

            <StatCard
              label="CGST"
              value={`₹${money(data.cgstAmount)}`}
            />

            <StatCard
              label="SGST"
              value={`₹${money(data.sgstAmount)}`}
            />

            <StatCard
              label="IGST"
              value={`₹${money(data.igstAmount)}`}
            />

            <StatCard
              label="Sales Bills"
              value={data.salesCount.toLocaleString(
                "en-IN",
              )}
            />

            <StatCard
              label="Purchase Bills"
              value={data.purchaseCount.toLocaleString(
                "en-IN",
              )}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            GSTR-1 / GSTR-3B formatted returns are not
            generated yet - this is a combined summary
            only.
          </p>
        </>
      )}
    </div>
  );
}
