"use client";

import { useMemo, useState } from "react";
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
  ItemSalesRow,
  PartySalesRow,
  SalesRegisterRow,
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

const billColumns: ColumnDef<SalesRegisterRow>[] = [
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
    id: "customer",
    header: "Customer",
    cell: ({ row }) =>
      row.original.customerName,
  },
  {
    accessorKey: "isCredit",
    header: "Type",
    cell: ({ row }) =>
      row.original.isCredit
        ? "Credit"
        : "Cash",
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

const itemColumns: ColumnDef<ItemSalesRow>[] = [
  { accessorKey: "itemCode", header: "Item Code" },
  { accessorKey: "itemName", header: "Item Name" },
  { accessorKey: "qtySold", header: "Qty Sold" },
  {
    accessorKey: "salesValue",
    header: "Sales Value",
    cell: ({ row }) =>
      `₹${money(row.original.salesValue)}`,
  },
];

const billExportColumns: CsvColumn<SalesRegisterRow>[] = [
  { header: "Bill No", accessor: (r) => r.billNo },
  { header: "Date", accessor: (r) => r.billDate },
  {
    header: "Customer",
    accessor: (r) => r.customerName,
  },
  {
    header: "Type",
    accessor: (r) => (r.isCredit ? "Credit" : "Cash"),
  },
  {
    header: "Taxable",
    accessor: (r) => r.taxableAmount,
  },
  {
    header: "Net Amount",
    accessor: (r) => r.netAmount,
  },
];

const itemExportColumns: CsvColumn<ItemSalesRow>[] = [
  {
    header: "Item Code",
    accessor: (r) => r.itemCode,
  },
  {
    header: "Item Name",
    accessor: (r) => r.itemName,
  },
  {
    header: "Qty Sold",
    accessor: (r) => r.qtySold,
  },
  {
    header: "Sales Value",
    accessor: (r) => r.salesValue,
  },
];

const partyExportColumns: CsvColumn<PartySalesRow>[] = [
  {
    header: "Customer Code",
    accessor: (r) => r.customerCode,
  },
  {
    header: "Customer Name",
    accessor: (r) => r.customerName,
  },
  {
    header: "Bills",
    accessor: (r) => r.billCount,
  },
  {
    header: "Sales Value",
    accessor: (r) => r.salesValue,
  },
];

const partyColumns: ColumnDef<PartySalesRow>[] = [
  {
    accessorKey: "customerCode",
    header: "Customer Code",
  },
  {
    accessorKey: "customerName",
    header: "Customer Name",
  },
  {
    accessorKey: "billCount",
    header: "Bills",
  },
  {
    accessorKey: "salesValue",
    header: "Sales Value",
    cell: ({ row }) =>
      `₹${money(row.original.salesValue)}`,
  },
];

export default function SalesReportPage() {
  const [tab, setTab] = useState("bill");
  const [search, setSearch] = useState("");

  const { data: bills = [], isLoading: billsLoading } =
    useQuery({
      queryKey: ["reports", "sales-register"],
      queryFn: ReportsService.getSalesRegister,
    });

  const { data: items = [], isLoading: itemsLoading } =
    useQuery({
      queryKey: ["reports", "item-sales"],
      queryFn: ReportsService.getItemSalesReport,
    });

  const {
    data: parties = [],
    isLoading: partiesLoading,
  } = useQuery({
    queryKey: ["reports", "party-sales"],
    queryFn: ReportsService.getPartySalesReport,
  });

  const filteredBills = useMemo(
    () =>
      bills.filter(
        (row) =>
          row.billNo
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.customerName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [bills, search],
  );

  const filteredItems = useMemo(
    () =>
      items.filter(
        (row) =>
          row.itemCode
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.itemName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const filteredParties = useMemo(
    () =>
      parties.filter(
        (row) =>
          row.customerCode
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          row.customerName
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [parties, search],
  );

  function handleExport(format: "csv" | "xlsx") {
    const download = format === "csv" ? downloadCsv : downloadXlsx;

    if (tab === "bill") {
      download("sales-bill-wise", filteredBills, billExportColumns);
    } else if (tab === "item") {
      download("sales-item-wise", filteredItems, itemExportColumns);
    } else {
      download("sales-party-wise", filteredParties, partyExportColumns);
    }
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Sales Report"
        description="Bill-wise, item-wise, and party-wise sales."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search..."
        onExport={() => handleExport("csv")}
        onExportExcel={() => handleExport("xlsx")}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bill">
            Bill-wise
          </TabsTrigger>
          <TabsTrigger value="item">
            Item-wise
          </TabsTrigger>
          <TabsTrigger value="party">
            Party-wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bill">
          <ERPDataTable
            columns={billColumns}
            data={filteredBills}
            loading={billsLoading}
          />
        </TabsContent>

        <TabsContent value="item">
          <ERPDataTable
            columns={itemColumns}
            data={filteredItems}
            loading={itemsLoading}
          />
        </TabsContent>

        <TabsContent value="party">
          <ERPDataTable
            columns={partyColumns}
            data={filteredParties}
            loading={partiesLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
