"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { PriceList } from "../types/price-list.types";
import { getPriceListColumns } from "./PriceListColumns";

interface PriceListTableProps {
  data: PriceList[];
  loading?: boolean;

  onEdit(priceList: PriceList): void;
  onDelete(priceList: PriceList): void;
}

export default function PriceListTable({
  data,
  onEdit,
  onDelete,
}: PriceListTableProps) {
  return (
    <ERPDataTable
      columns={getPriceListColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}