"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import type { SalesOrderListItem } from "@/services/sales-order/sales-order.service";
import { getSalesOrderColumns } from "./SalesOrderColumns";

interface SalesOrderTableProps {
  data: SalesOrderListItem[];
  loading?: boolean;
}

export default function SalesOrderTable({
  data,
  loading,
}: SalesOrderTableProps) {
  return (
    <ERPDataTable
      columns={getSalesOrderColumns()}
      data={data}
      loading={loading}
    />
  );
}
