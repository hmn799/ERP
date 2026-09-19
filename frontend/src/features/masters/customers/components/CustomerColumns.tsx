"use client";

import { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";

import ActionColumn from "@/components/erp/crud/columns/ActionColumn";
import { Button } from "@/components/ui/button";

import { openCustomerStatementPdf } from "@/lib/pdf";

import { Customer } from "../types/customer.types";

function currentYearRange() {
  const year = new Date().getFullYear();
  return {
    from: `${year}-01-01`,
    to: new Date().toISOString().slice(0, 10),
  };
}

interface CustomerColumnOptions {
  onEdit?(customer: Customer): void;
  onDelete?(customer: Customer): void;
}

export function getCustomerColumns({
  onEdit,
  onDelete,
}: CustomerColumnOptions): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "customerCode",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Customer",
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
    },
    {
      accessorKey: "gstin",
      header: "GSTIN",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? "Active" : "Inactive",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="outline"
            title="Download account statement (this year, PDF)"
            onClick={() => {
              const { from, to } = currentYearRange();
              openCustomerStatementPdf(row.original.id, from, to);
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>

          <ActionColumn
            row={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ];
}