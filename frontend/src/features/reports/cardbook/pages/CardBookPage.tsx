"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import ReportsService, {
  CashBookRow,
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

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const columns: ColumnDef<CashBookRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Date(
        row.original.date,
      ).toLocaleDateString("en-IN"),
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "partyName",
    header: "Party",
  },
  {
    accessorKey: "receipt",
    header: "Card In",
    cell: ({ row }) =>
      row.original.receipt
        ? `₹${money(row.original.receipt)}`
        : "-",
  },
  {
    accessorKey: "payment",
    header: "Card Out",
    cell: ({ row }) =>
      row.original.payment
        ? `₹${money(row.original.payment)}`
        : "-",
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => (
      <span
        className={
          row.original.balance < 0
            ? "text-red-600"
            : ""
        }
      >
        ₹{money(row.original.balance)}
      </span>
    ),
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) =>
      row.original.remarks || "-",
  },
];

const exportColumns: CsvColumn<CashBookRow>[] = [
  {
    header: "Date",
    accessor: (r) =>
      new Date(r.date).toLocaleDateString("en-IN"),
  },
  { header: "Type", accessor: (r) => r.type },
  {
    header: "Party",
    accessor: (r) => r.partyName,
  },
  {
    header: "Card In",
    accessor: (r) => r.receipt,
  },
  {
    header: "Card Out",
    accessor: (r) => r.payment,
  },
  {
    header: "Balance",
    accessor: (r) => r.balance,
  },
  {
    header: "Remarks",
    accessor: (r) => r.remarks ?? "",
  },
];

export default function CardBookPage() {
  const [from, setFrom] = useState(
    firstDayOfMonth(),
  );
  const [to, setTo] = useState(today());

  const {
    data = [],
    isLoading,
  } = useQuery({
    queryKey: ["reports", "card-book", from, to],
    queryFn: () =>
      ReportsService.getCardBook(from, to),
  });

  const totals = useMemo(() => {
    const receipt = data.reduce(
      (sum, row) => sum + row.receipt,
      0,
    );

    const payment = data.reduce(
      (sum, row) => sum + row.payment,
      0,
    );

    const closingBalance =
      data.length > 0
        ? data[data.length - 1].balance
        : 0;

    return { receipt, payment, closingBalance };
  }, [data]);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Card Book"
        description="Card payment collections from sales, with a running balance. Cash and UPI are tracked separately - see Cash Book / UPI Book."
        onExport={() =>
          downloadCsv("card-book", data, exportColumns)
        }
        onExportExcel={() =>
          downloadXlsx("card-book", data, exportColumns)
        }
        exportDisabled={data.length === 0}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            From
          </label>

          <input
            type="date"
            value={from}
            onChange={(e) =>
              setFrom(e.target.value)
            }
            className="h-10 rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            To
          </label>

          <input
            type="date"
            value={to}
            onChange={(e) =>
              setTo(e.target.value)
            }
            className="h-10 rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          Total Card In:{" "}
          <span className="font-semibold text-green-700">
            ₹{money(totals.receipt)}
          </span>
        </div>

        <div>
          Total Card Out:{" "}
          <span className="font-semibold text-red-600">
            ₹{money(totals.payment)}
          </span>
        </div>

        <div>
          Closing Balance:{" "}
          <span
            className={`font-semibold ${
              totals.closingBalance < 0
                ? "text-red-600"
                : "text-green-700"
            }`}
          >
            ₹{money(totals.closingBalance)}
          </span>
        </div>
      </div>

      <ERPDataTable
        columns={columns}
        data={data}
        loading={isLoading}
        emptyMessage="No card transactions in this date range."
      />
    </div>
  );
}
