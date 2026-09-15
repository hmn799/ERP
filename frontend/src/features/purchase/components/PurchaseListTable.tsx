"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import {
  formatCurrency,
  formatDate,
  formatInteger,
} from "@/shared/utils/format";

import { PurchaseListItem } from "../types/purchase-list.types";

interface PurchaseListTableProps {
  data: PurchaseListItem[];
  loading?: boolean;
}

export default function PurchaseListTable({
  data,
  loading,
}: PurchaseListTableProps) {
  const router =
    useRouter();

  const columns: ColumnDef<PurchaseListItem>[] =
    [
      {
        accessorKey: "billNo",

        header: "Bill No",

        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/purchase/edit/${row.original.id}`,
              )
            }
            className="font-medium text-blue-600 hover:underline"
          >
            {row.original.billNo}
          </button>
        ),
      },

      {
        accessorKey: "billDate",

        header: "Bill Date",

        cell: ({ row }) =>
          formatDate(
            row.original.billDate,
          ),
      },

      {
        accessorKey:
          "invoiceNo",

        header: "Invoice No",

        cell: ({ row }) =>
          row.original.invoiceNo ||
          "-",
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
              row.original
                .totalItems,
            )}
          </div>
        ),
      },

      {
        accessorKey:
          "totalAmount",

        header: () => (
          <div className="text-right">
            Amount
          </div>
        ),

        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(
              row.original
                .totalAmount,
            )}
          </div>
        ),
      },

      {
        accessorKey: "status",

        header: "Status",

        cell: ({ row }) => {
          const status =
            row.original.status;

          if (
            status ===
            "CANCELLED"
          ) {
            return (
              <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                CANCELLED
              </span>
            );
          }

          return (
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              ACTIVE
            </span>
          );
        },
      },

      {
        id: "actions",

        header: "Actions",

        cell: ({ row }) => {
          const cancelled =
            row.original.status ===
            "CANCELLED";

          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/purchase/edit/${row.original.id}`,
                  )
                }
                className="rounded border px-3 py-1 text-xs hover:bg-muted"
              >
                {cancelled
                  ? "View"
                  : "Edit"}
              </button>
            </div>
          );
        },
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