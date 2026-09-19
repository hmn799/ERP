"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import ReportsService, {
  BatchStockRow,
  StockLedgerRow,
  StockRow,
  StockValuationRow,
} from "@/services/reports/reports.service";

import ReportHeader from "../../components/ReportHeader";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import { downloadXlsx } from "@/lib/xlsx";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const currentColumns: ColumnDef<StockRow>[] = [
  { accessorKey: "itemCode", header: "Item Code" },
  { accessorKey: "itemName", header: "Item Name" },
  { accessorKey: "stock", header: "Stock" },
];

const batchColumns: ColumnDef<BatchStockRow>[] = [
  { accessorKey: "itemCode", header: "Item Code" },
  { accessorKey: "itemName", header: "Item Name" },
  { accessorKey: "batchNo", header: "Batch No" },
  { accessorKey: "stock", header: "Stock" },
  {
    accessorKey: "mrp",
    header: "MRP",
    cell: ({ row }) =>
      `₹${money(row.original.mrp)}`,
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry",
    cell: ({ row }) =>
      row.original.expiryDate
        ? new Date(
            row.original.expiryDate,
          ).toLocaleDateString("en-IN")
        : "-",
  },
];

const valuationColumns: ColumnDef<StockValuationRow>[] =
  [
    { accessorKey: "itemCode", header: "Item Code" },
    { accessorKey: "itemName", header: "Item Name" },
    { accessorKey: "stock", header: "Stock" },
    {
      accessorKey: "purchaseRate",
      header: "Purchase Rate",
      cell: ({ row }) =>
        `₹${money(row.original.purchaseRate)}`,
    },
    {
      accessorKey: "stockValue",
      header: "Stock Value",
      cell: ({ row }) =>
        `₹${money(row.original.stockValue)}`,
    },
  ];

const movementColumns: ColumnDef<StockLedgerRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Date(
        row.original.date,
      ).toLocaleDateString("en-IN"),
  },
  { accessorKey: "itemName", header: "Item" },
  { accessorKey: "batchNo", header: "Batch" },
  { accessorKey: "warehouse", header: "Warehouse" },
  {
    accessorKey: "transactionType",
    header: "Type",
  },
  { accessorKey: "qtyIn", header: "Qty In" },
  { accessorKey: "qtyOut", header: "Qty Out" },
  { accessorKey: "balance", header: "Balance" },
];

const currentExportColumns: CsvColumn<StockRow>[] = [
  { header: "Item Code", accessor: (r) => r.itemCode },
  { header: "Item Name", accessor: (r) => r.itemName },
  { header: "Stock", accessor: (r) => r.stock },
];

const batchExportColumns: CsvColumn<BatchStockRow>[] = [
  { header: "Item Code", accessor: (r) => r.itemCode },
  { header: "Item Name", accessor: (r) => r.itemName },
  { header: "Batch No", accessor: (r) => r.batchNo },
  { header: "Stock", accessor: (r) => r.stock },
  { header: "MRP", accessor: (r) => r.mrp },
  {
    header: "Expiry",
    accessor: (r) => r.expiryDate,
  },
];

const valuationExportColumns: CsvColumn<StockValuationRow>[] = [
  { header: "Item Code", accessor: (r) => r.itemCode },
  { header: "Item Name", accessor: (r) => r.itemName },
  { header: "Stock", accessor: (r) => r.stock },
  {
    header: "Purchase Rate",
    accessor: (r) => r.purchaseRate,
  },
  {
    header: "Stock Value",
    accessor: (r) => r.stockValue,
  },
];

const movementExportColumns: CsvColumn<StockLedgerRow>[] = [
  { header: "Date", accessor: (r) => r.date },
  { header: "Item", accessor: (r) => r.itemName },
  { header: "Batch", accessor: (r) => r.batchNo },
  {
    header: "Warehouse",
    accessor: (r) => r.warehouse,
  },
  {
    header: "Type",
    accessor: (r) => r.transactionType,
  },
  { header: "Qty In", accessor: (r) => r.qtyIn },
  { header: "Qty Out", accessor: (r) => r.qtyOut },
  { header: "Balance", accessor: (r) => r.balance },
];

const VALID_TABS = [
  "current",
  "batch",
  "valuation",
  "movement",
];

function StockReportContent() {
  const searchParams = useSearchParams();

  const initialTab =
    searchParams.get("tab") ?? "current";

  const [tab, setTab] = useState(
    VALID_TABS.includes(initialTab)
      ? initialTab
      : "current",
  );

  const [search, setSearch] = useState("");

  const {
    data: current = [],
    isLoading: currentLoading,
  } = useQuery({
    queryKey: ["reports", "stock-current"],
    queryFn: ReportsService.getStockReport,
  });

  const {
    data: batches = [],
    isLoading: batchesLoading,
  } = useQuery({
    queryKey: ["reports", "stock-batch"],
    queryFn: ReportsService.getBatchStockReport,
  });

  const {
    data: valuation,
    isLoading: valuationLoading,
  } = useQuery({
    queryKey: ["reports", "stock-valuation"],
    queryFn: ReportsService.getStockValuationReport,
  });

  const {
    data: movement = [],
    isLoading: movementLoading,
  } = useQuery({
    queryKey: ["reports", "stock-movement"],
    queryFn: ReportsService.getStockLedgerReport,
  });

  const filteredCurrent = useMemo(
    () =>
      current.filter(
        (row) =>
          row.itemCode
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.itemName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [current, search],
  );

  const filteredBatches = useMemo(
    () =>
      batches.filter(
        (row) =>
          row.itemCode
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.itemName
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.batchNo
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [batches, search],
  );

  const valuationItems = valuation?.items ?? [];

  const filteredValuation = useMemo(
    () =>
      valuationItems.filter(
        (row) =>
          row.itemCode
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.itemName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [valuationItems, search],
  );

  const filteredMovement = useMemo(
    () =>
      movement.filter(
        (row) =>
          row.itemName
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.batchNo
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [movement, search],
  );

  function handleExport(format: "csv" | "xlsx") {
    const download = format === "csv" ? downloadCsv : downloadXlsx;

    if (tab === "current") {
      download("stock-current", filteredCurrent, currentExportColumns);
    } else if (tab === "batch") {
      download("stock-batch-wise", filteredBatches, batchExportColumns);
    } else if (tab === "valuation") {
      download(
        "stock-valuation",
        filteredValuation,
        valuationExportColumns,
      );
    } else {
      download("stock-movement", filteredMovement, movementExportColumns);
    }
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Stock Report"
        description="Current stock, batch-wise stock, valuation, and movement."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search..."
        onExport={() => handleExport("csv")}
        onExportExcel={() => handleExport("xlsx")}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="current">
            Current
          </TabsTrigger>
          <TabsTrigger value="batch">
            Batch-wise
          </TabsTrigger>
          <TabsTrigger value="valuation">
            Valuation
          </TabsTrigger>
          <TabsTrigger value="movement">
            Movement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <ERPDataTable
            columns={currentColumns}
            data={filteredCurrent}
            loading={currentLoading}
          />
        </TabsContent>

        <TabsContent value="batch">
          <ERPDataTable
            columns={batchColumns}
            data={filteredBatches}
            loading={batchesLoading}
          />
        </TabsContent>

        <TabsContent value="valuation">
          {valuation && (
            <div className="mb-3 text-sm">
              Total Stock Value:{" "}
              <span className="font-semibold">
                ₹{money(valuation.totalStockValue)}
              </span>
            </div>
          )}

          <ERPDataTable
            columns={valuationColumns}
            data={filteredValuation}
            loading={valuationLoading}
          />
        </TabsContent>

        <TabsContent value="movement">
          <ERPDataTable
            columns={movementColumns}
            data={filteredMovement}
            loading={movementLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StockReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          Loading stock report...
        </div>
      }
    >
      <StockReportContent />
    </Suspense>
  );
}
