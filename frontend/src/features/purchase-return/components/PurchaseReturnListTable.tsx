"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

import { PurchaseReturnListItem } from "../types/purchase-return.types";

interface Props {
  data: PurchaseReturnListItem[];
  loading?: boolean;
}

export default function PurchaseReturnListTable({
  data,
  loading,
}: Props) {
  const router = useRouter();

  const columns: ColumnDef<PurchaseReturnListItem>[] =
    [
      {
        accessorKey: "returnNo",

        header: "Return No",

        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/purchase-return/view/${row.original.id}`,
              )
            }
            className="
              font-medium
              text-blue-600
              hover:underline
            "
          >
            {row.original.returnNo}
          </button>
        ),
      },

      {
        accessorKey: "returnDate",

        header: "Return Date",

        cell: ({ row }) =>
          formatDate(
            row.original.returnDate,
          ),
      },

      {
        accessorKey:
          "purchaseBillNo",

        header: "Purchase Bill",

        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.purchaseBillNo}
          </span>
        ),
      },

      {
        accessorKey:
          "supplierName",

        header: "Supplier",
      },

      {
        accessorKey:
          "warehouseName",

        header: "Warehouse",
      },

      {
        accessorKey:
          "totalItems",

        header: () => (
          <div className="text-right">
            Items
          </div>
        ),

        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(
              row.original.totalItems,
            )}
          </div>
        ),
      },

      {
        accessorKey:
          "totalQty",

        header: () => (
          <div className="text-right">
            Qty
          </div>
        ),

        cell: ({ row }) => (
          <div className="text-right">
            {formatInteger(
              row.original.totalQty,
            )}
          </div>
        ),
      },

      {
        accessorKey:
          "netAmount",

        header: () => (
          <div className="text-right">
            Amount
          </div>
        ),

        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(
              row.original.netAmount,
            )}
          </div>
        ),
      },
    ];

  return (
    <ERPDataTable
      columns={columns}
      data={data}
      loading={loading}
    />
  );
}