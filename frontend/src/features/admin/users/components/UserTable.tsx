"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { User } from "../types/user.types";
import { getUserColumns } from "./UserColumns";

interface UserTableProps {
  data: User[];

  loading?: boolean;

  onEdit(user: User): void;

  onResetPassword(user: User): void;

  onDelete(user: User): void;
}

export default function UserTable({
  data,
  loading,
  onEdit,
  onResetPassword,
  onDelete,
}: UserTableProps) {
  return (
    <ERPDataTable
      columns={getUserColumns({
        onEdit,
        onResetPassword,
        onDelete,
      })}
      data={data}
      loading={loading}
    />
  );
}
