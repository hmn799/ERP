"use client";

import { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { User } from "../types/user.types";

interface UserColumnOptions {
  onEdit?(user: User): void;
  onResetPassword?(user: User): void;
  onDelete?(user: User): void;
}

export function getUserColumns({
  onEdit,
  onResetPassword,
  onDelete,
}: UserColumnOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "fullName",
      header: "Full Name",
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) =>
        row.original.mobile || "-",
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => row.original.role.name,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive
          ? "Active"
          : "Inactive",
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
              onResetPassword?.(row.original)
            }
          >
            <KeyRound className="h-4 w-4" />
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
