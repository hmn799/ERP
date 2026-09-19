"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import ReportsService, {
  ProfitRow,
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

const columns: ColumnDef<ProfitRow>[] = [
  { accessorKey: "itemCode", header: "Item Code" },
  { accessorKey: "itemName", header: "Item Name" },
  { accessorKey: "batchNo", header: "Batch" },
  { accessorKey: "qty", header: "Qty" },
  {
    accessorKey: "saleValue",
    header: "Sale Value",
    cell: ({ row }) =>
      `₹${money(row.original.saleValue)}`,
  },
  {
    accessorKey: "costValue",
    header: "Cost Value",
    cell: ({ row }) =>
      `₹${money(row.original.costValue)}`,
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }) => (
      <span
        className={
          row.original.profit < 0
            ? "text-red-600"
            : "text-green-700"
        }
      >
        ₹{money(row.original.profit)}
      </span>
    ),
  },
];

const exportColumns: CsvColumn<ProfitRow>[] = [
  {
    header: "Item Code",
    accessor: (r) => r.itemCode,
  },
  {
    header: "Item Name",
    accessor: (r) => r.itemName,
  },
  {
    header: "Batch",
    accessor: (r) => r.batchNo,
  },
  { header: "Qty", accessor: (r) => r.qty },
  {
    header: "Sale Value",
    accessor: (r) => r.saleValue,
  },
  {
    header: "Cost Value",
    accessor: (r) => r.costValue,
  },
  {
    header: "Profit",
    accessor: (r) => r.profit,
  },
];

export default function ProfitReportPage() {
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["reports", "profit"],
    queryFn: ReportsService.getProfitReport,
  });

  const filtered = useMemo(
    () =>
      data.filter(
        (row) =>
          row.itemCode
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.itemName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, search],
  );

  const totalProfit = filtered.reduce(
    (sum, row) => sum + row.profit,
    0,
  );

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Profit Report"
        description="Item and batch level profit from sales."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by item..."
        onExport={() =>
          downloadCsv("profit-report", filtered, exportColumns)
        }
        onExportExcel={() =>
          downloadXlsx("profit-report", filtered, exportColumns)
        }
      />

      <div className="text-sm">
        Total Profit:{" "}
        <span
          className={`font-semibold ${
            totalProfit < 0
              ? "text-red-600"
              : "text-green-700"
          }`}
        >
          ₹{money(totalProfit)}
        </span>
      </div>

      <ERPDataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
      />
    </div>
  );
}
