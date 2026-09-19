"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Role } from "@/services/role/role.service";

interface RoleColumnOptions {
  onEdit?(role: Role): void;
  onPermissions?(role: Role): void;
  onDelete?(role: Role): void;
}

export function getRoleColumns({
  onEdit,
  onPermissions,
  onDelete,
}: RoleColumnOptions): ColumnDef<Role>[] {
  return [
    {
      accessorKey: "name",
      header: "Role Name",
    },
    {
      id: "permissionCount",
      header: "Permissions",
      cell: ({ row }) =>
        `${row.original.permissions?.length ?? 0}`,
    },
    {
      id: "userCount",
      header: "Users",
      cell: ({ row }) =>
        `${row.original.userCount ?? 0}`,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              onEdit?.(row.original)
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              onPermissions?.(row.original)
            }
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="destructive"
            onClick={() =>
              onDelete?.(row.original)
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
