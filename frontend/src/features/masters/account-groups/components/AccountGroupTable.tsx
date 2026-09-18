"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { AccountGroup } from "../types/account-group.types";
import { getAccountGroupColumns } from "./AccountGroupColumns";

interface AccountGroupTableProps {
  data: AccountGroup[];

  loading?: boolean;

  onEdit(accountGroup: AccountGroup): void;

  onDelete(accountGroup: AccountGroup): void;
}

export default function AccountGroupTable({
  data,
  loading,
  onEdit,
  onDelete,
}: AccountGroupTableProps) {
  return (
    <ERPDataTable
      columns={getAccountGroupColumns({
        onEdit,
        onDelete,
      })}
      data={data}
      loading={loading}
    />
  );
}
