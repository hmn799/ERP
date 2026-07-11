"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { Customer } from "../types/customer.types";
import { getCustomerColumns } from "./CustomerColumns";

interface CustomerTableProps {
  data: Customer[];

  loading?: boolean;

  onEdit(customer: Customer): void;

  onDelete(customer: Customer): void;
}

export default function CustomerTable({
  data,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  return (
    <ERPDataTable
      columns={getCustomerColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}