"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import ReportsService, {
  Gstr1B2BRow,
  Gstr1B2CLargeRow,
  Gstr1B2CSmallRow,
  Gstr1HsnRow,
} from "@/services/reports/reports.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
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

function NotesList({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;

  return (
    <ul className="list-disc space-y-1 rounded-md border bg-muted/30 p-3 pl-6 text-xs text-muted-foreground">
      {notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  );
}

function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange(value: string): void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="gst-return-month"
        className="text-sm text-muted-foreground"
      >
        Period
      </Label>

      <Input
        id="gst-return-month"
        type="month"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        className="w-40"
      />
    </div>
  );
}

const b2bColumns: ColumnDef<Gstr1B2BRow>[] = [
  { accessorKey: "billNo", header: "Bill No" },
  {
    accessorKey: "billDate",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.original.billDate).toLocaleDateString(
        "en-IN",
      ),
  },
  { accessorKey: "customerName", header: "Customer" },
  { accessorKey: "gstin", header: "GSTIN" },
  { accessorKey: "placeOfSupply", header: "Place of Supply" },
  {
    accessorKey: "taxableValue",
    header: "Taxable Value",
    cell: ({ row }) => `₹${money(row.original.taxableValue)}`,
  },
  {
    accessorKey: "invoiceValue",
    header: "Invoice Value",
    cell: ({ row }) => `₹${money(row.original.invoiceValue)}`,
  },
];

const b2cLargeColumns: ColumnDef<Gstr1B2CLargeRow>[] = [
  { accessorKey: "billNo", header: "Bill No" },
  {
    accessorKey: "billDate",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.original.billDate).toLocaleDateString(
        "en-IN",
      ),
  },
  { accessorKey: "placeOfSupply", header: "Place of Supply" },
  {
    accessorKey: "taxableValue",
    header: "Taxable Value",
    cell: ({ row }) => `₹${money(row.original.taxableValue)}`,
  },
  {
    accessorKey: "igst",
    header: "IGST",
    cell: ({ row }) => `₹${money(row.original.igst)}`,
  },
];

const b2csColumns: ColumnDef<Gstr1B2CSmallRow>[] = [
  { accessorKey: "placeOfSupply", header: "Place of Supply" },
  {
    accessorKey: "ratePercent",
    header: "Rate %",
    cell: ({ row }) => `${row.original.ratePercent}%`,
  },
  {
    accessorKey: "taxableValue",
    header: "Taxable Value",
    cell: ({ row }) => `₹${money(row.original.taxableValue)}`,
  },
  {
    accessorKey: "cgst",
    header: "CGST",
    cell: ({ row }) => `₹${money(row.original.cgst)}`,
  },
  {
    accessorKey: "sgst",
    header: "SGST",
    cell: ({ row }) => `₹${money(row.original.sgst)}`,
  },
  {
    accessorKey: "igst",
    header: "IGST",
    cell: ({ row }) => `₹${money(row.original.igst)}`,
  },
];

const hsnColumns: ColumnDef<Gstr1HsnRow>[] = [
  { accessorKey: "hsnCode", header: "HSN Code" },
  { accessorKey: "qty", header: "Qty" },
  {
    accessorKey: "taxableValue",
    header: "Taxable Value",
    cell: ({ row }) => `₹${money(row.original.taxableValue)}`,
  },
  {
    accessorKey: "cgst",
    header: "CGST",
    cell: ({ row }) => `₹${money(row.original.cgst)}`,
  },
  {
    accessorKey: "sgst",
    header: "SGST",
    cell: ({ row }) => `₹${money(row.original.sgst)}`,
  },
  {
    accessorKey: "igst",
    header: "IGST",
    cell: ({ row }) => `₹${money(row.original.igst)}`,
  },
];

function Gstr1Tab() {
  const [month, setMonth] = useState(currentMonth());

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "gstr1", month],
    queryFn: () => ReportsService.getGstr1(month),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker month={month} onChange={setMonth} />

        {data && (
          <div className="text-sm text-muted-foreground">
            {data.company.legalName || "Company name not set"}
            {data.company.gstin
              ? ` · ${data.company.gstin}`
              : " · GSTIN not set"}
          </div>
        )}
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Invoices"
              value={data.summary.totalInvoices.toLocaleString(
                "en-IN",
              )}
            />
            <StatCard
              label="Taxable Value"
              value={`₹${money(data.summary.totalTaxableValue)}`}
            />
            <StatCard
              label="Total Tax"
              value={`₹${money(data.summary.totalTax)}`}
            />
            <StatCard
              label="Invoice Value"
              value={`₹${money(data.summary.totalInvoiceValue)}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                B2B - Registered Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ERPDataTable
                columns={b2bColumns}
                data={data.b2b}
                emptyMessage="No B2B invoices this period."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                B2C (Large) - Inter-state, over ₹2.5L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ERPDataTable
                columns={b2cLargeColumns}
                data={data.b2cLarge}
                emptyMessage="No B2C (Large) invoices this period."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                B2C (Small) - Summary by Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ERPDataTable
                columns={b2csColumns}
                data={data.b2cSmall}
                emptyMessage="No B2C (Small) sales this period."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                HSN Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ERPDataTable
                columns={hsnColumns}
                data={data.hsnSummary}
                emptyMessage="No HSN data this period."
              />
            </CardContent>
          </Card>

          <NotesList notes={data.notes} />
        </>
      )}
    </div>
  );
}

function Gstr3bTab() {
  const [month, setMonth] = useState(currentMonth());

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "gstr3b", month],
    queryFn: () => ReportsService.getGstr3b(month),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker month={month} onChange={setMonth} />

        {data && (
          <div className="text-sm text-muted-foreground">
            {data.company.legalName || "Company name not set"}
            {data.company.gstin
              ? ` · ${data.company.gstin}`
              : " · GSTIN not set"}
          </div>
        )}
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                3.1 Outward Supplies
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Taxable Value"
                value={`₹${money(
                  data.section3_1OutwardSupplies
                    .taxableOutwardSupplies.taxableValue,
                )}`}
              />
              <StatCard
                label="CGST"
                value={`₹${money(
                  data.section3_1OutwardSupplies
                    .taxableOutwardSupplies.cgst ?? 0,
                )}`}
              />
              <StatCard
                label="SGST"
                value={`₹${money(
                  data.section3_1OutwardSupplies
                    .taxableOutwardSupplies.sgst ?? 0,
                )}`}
              />
              <StatCard
                label="IGST"
                value={`₹${money(
                  data.section3_1OutwardSupplies
                    .taxableOutwardSupplies.igst,
                )}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                4. Eligible ITC
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Taxable Value"
                value={`₹${money(
                  data.section4EligibleItc.allOtherItc
                    .taxableValue,
                )}`}
              />
              <StatCard
                label="CGST"
                value={`₹${money(
                  data.section4EligibleItc.allOtherItc
                    .cgst ?? 0,
                )}`}
              />
              <StatCard
                label="SGST"
                value={`₹${money(
                  data.section4EligibleItc.allOtherItc
                    .sgst ?? 0,
                )}`}
              />
              <StatCard
                label="IGST"
                value={`₹${money(
                  data.section4EligibleItc.allOtherItc.igst,
                )}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                6.1 Tax Payable
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <StatCard
                label="CGST Payable"
                value={`₹${money(
                  data.section6_1TaxPayable.cgst,
                )}`}
              />
              <StatCard
                label="SGST Payable"
                value={`₹${money(
                  data.section6_1TaxPayable.sgst,
                )}`}
              />
              <StatCard
                label="IGST Payable"
                value={`₹${money(
                  data.section6_1TaxPayable.igst,
                )}`}
              />
            </CardContent>
          </Card>

          <NotesList notes={data.notes} />
        </>
      )}
    </div>
  );
}

function SummaryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "gst-summary"],
    queryFn: ReportsService.getGstSummary,
  });

  return isLoading || !data ? (
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
          value={data.salesCount.toLocaleString("en-IN")}
        />
        <StatCard
          label="Purchase Bills"
          value={data.purchaseCount.toLocaleString("en-IN")}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        All-time combined total across sales and purchases -
        not period-scoped and not split by direction. Use the
        GSTR-1 and GSTR-3B tabs for period-based, correctly
        separated figures.
      </p>
    </>
  );
}

export default function GstReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GST Report</h1>

        <p className="text-sm text-muted-foreground">
          GST liability summary, and period-based GSTR-1 /
          GSTR-3B filing-aid returns.
        </p>
      </div>

      <Tabs defaultValue="gstr1">
        <TabsList>
          <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
          <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
          <TabsTrigger value="summary">
            All-Time Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gstr1">
          <Gstr1Tab />
        </TabsContent>

        <TabsContent value="gstr3b">
          <Gstr3bTab />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
