"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import type { StockTransferListItem } from "@/services/stock-transfer/stock-transfer.service";
import { getStockTransferColumns } from "./StockTransferColumns";

interface StockTransferTableProps {
  data: StockTransferListItem[];
  loading?: boolean;
  onDelete(transfer: StockTransferListItem): void;
}

export default function StockTransferTable({
  data,
  loading,
  onDelete,
}: StockTransferTableProps) {
  return (
    <ERPDataTable
      columns={getStockTransferColumns({ onDelete })}
      data={data}
      loading={loading}
    />
  );
}
