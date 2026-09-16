"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import ReportsService, {
  PurchaseRegisterRow,
} from "@/services/reports/reports.service";

import ReportHeader from "../../components/ReportHeader";
import { downloadCsv } from "@/lib/csv";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const columns: ColumnDef<PurchaseRegisterRow>[] = [
  { accessorKey: "billNo", header: "Bill No" },
  {
    accessorKey: "billDate",
    header: "Date",
    cell: ({ row }) =>
      new Date(
        row.original.billDate,
      ).toLocaleDateString("en-IN"),
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) =>
      row.original.supplierName,
  },
  {
    accessorKey: "taxableAmount",
    header: "Taxable",
    cell: ({ row }) =>
      `₹${money(row.original.taxableAmount)}`,
  },
  {
    accessorKey: "netAmount",
    header: "Net Amount",
    cell: ({ row }) =>
      `₹${money(row.original.netAmount)}`,
  },
];

export default function PurchaseReportPage() {
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["reports", "purchase-register"],
    queryFn: ReportsService.getPurchaseRegister,
  });

  const filtered = useMemo(
    () =>
      data.filter(
        (row) =>
          row.billNo
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.supplierName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, search],
  );

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Purchase Report"
        description="All purchase bills, supplier-wise."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by bill no or supplier..."
        onExport={() =>
          downloadCsv(
            "purchase-register",
            filtered,
            [
              {
                header: "Bill No",
                accessor: (r) => r.billNo,
              },
              {
                header: "Date",
                accessor: (r) => r.billDate,
              },
              {
                header: "Supplier",
                accessor: (r) => r.supplierName,
              },
              {
                header: "Taxable",
                accessor: (r) => r.taxableAmount,
              },
              {
                header: "Net Amount",
                accessor: (r) => r.netAmount,
              },
            ],
          )
        }
      />

      <ERPDataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
      />
    </div>
  );
}
