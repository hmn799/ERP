"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import type { OpeningStockEntry } from "@/services/opening-stock/opening-stock.service";
import { getOpeningStockColumns } from "./OpeningStockColumns";

interface OpeningStockTableProps {
  data: OpeningStockEntry[];
  loading?: boolean;
  onDelete(entry: OpeningStockEntry): void;
}

export default function OpeningStockTable({
  data,
  loading,
  onDelete,
}: OpeningStockTableProps) {
  return (
    <ERPDataTable
      columns={getOpeningStockColumns({ onDelete })}
      data={data}
      loading={loading}
    />
  );
}
