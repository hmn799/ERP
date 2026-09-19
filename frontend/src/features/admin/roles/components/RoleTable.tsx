"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import type { Role } from "@/services/role/role.service";
import { getRoleColumns } from "./RoleColumns";

interface RoleTableProps {
  data: Role[];

  loading?: boolean;

  onEdit(role: Role): void;

  onPermissions(role: Role): void;

  onDelete(role: Role): void;
}

export default function RoleTable({
  data,
  loading,
  onEdit,
  onPermissions,
  onDelete,
}: RoleTableProps) {
  return (
    <ERPDataTable
      columns={getRoleColumns({
        onEdit,
        onPermissions,
        onDelete,
      })}
      data={data}
      loading={loading}
    />
  );
}
