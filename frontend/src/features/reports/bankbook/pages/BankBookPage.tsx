"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import ReportsService, {
  BankBookRow,
} from "@/services/reports/reports.service";
import BankAccountService from "@/services/bank/bank-account.service";

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

const columns: ColumnDef<BankBookRow>[] = [
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
    accessorKey: "deposit",
    header: "Deposit",
    cell: ({ row }) =>
      row.original.deposit
        ? `₹${money(row.original.deposit)}`
        : "-",
  },
  {
    accessorKey: "withdrawal",
    header: "Withdrawal",
    cell: ({ row }) =>
      row.original.withdrawal
        ? `₹${money(row.original.withdrawal)}`
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

const exportColumns: CsvColumn<BankBookRow>[] = [
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
    header: "Deposit",
    accessor: (r) => r.deposit,
  },
  {
    header: "Withdrawal",
    accessor: (r) => r.withdrawal,
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

export default function BankBookPage() {
  const [bankAccountId, setBankAccountId] =
    useState("");

  const [from, setFrom] = useState(
    firstDayOfMonth(),
  );
  const [to, setTo] = useState(today());

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
    retry: false,
  });

  const {
    data = [],
    isLoading,
  } = useQuery({
    queryKey: [
      "reports",
      "bank-book",
      bankAccountId,
      from,
      to,
    ],
    queryFn: () =>
      ReportsService.getBankBook(
        bankAccountId,
        from,
        to,
      ),
    enabled: Boolean(bankAccountId),
  });

  const totals = useMemo(() => {
    const deposit = data.reduce(
      (sum, row) => sum + row.deposit,
      0,
    );

    const withdrawal = data.reduce(
      (sum, row) => sum + row.withdrawal,
      0,
    );

    const closingBalance =
      data.length > 0
        ? data[data.length - 1].balance
        : 0;

    return { deposit, withdrawal, closingBalance };
  }, [data]);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Bank Book"
        description="Deposits and withdrawals for one bank account, with a running balance."
        onExport={() =>
          downloadCsv("bank-book", data, exportColumns)
        }
        onExportExcel={() =>
          downloadXlsx("bank-book", data, exportColumns)
        }
        exportDisabled={data.length === 0}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Bank Account
          </label>

          <select
            value={bankAccountId}
            onChange={(e) =>
              setBankAccountId(e.target.value)
            }
            className="h-10 min-w-64 rounded-md border px-3 py-2 text-sm"
          >
            <option value="">
              Select bank account...
            </option>

            {bankAccounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
              >
                {account.name} -{" "}
                {account.bankName}
              </option>
            ))}
          </select>
        </div>

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

      {bankAccountId ? (
        <>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              Total Deposits:{" "}
              <span className="font-semibold text-green-700">
                ₹{money(totals.deposit)}
              </span>
            </div>

            <div>
              Total Withdrawals:{" "}
              <span className="font-semibold text-red-600">
                ₹{money(totals.withdrawal)}
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
            emptyMessage="No bank transactions in this date range."
          />
        </>
      ) : (
        <div className="rounded-md border bg-gray-50 p-8 text-center text-sm text-gray-500">
          Select a bank account to view its book.
        </div>
      )}
    </div>
  );
}
