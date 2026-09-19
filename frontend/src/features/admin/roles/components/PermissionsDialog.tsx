"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import PermissionService from "@/services/permission/permission.service";
import RoleService from "@/services/role/role.service";

import type { Role } from "@/services/role/role.service";

interface PermissionsDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  role?: Role;

  onSuccess?(): void;
}

function label(code: string) {
  return code
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export default function PermissionsDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: PermissionsDialogProps) {
  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: PermissionService.getAll,
  });

  const [selected, setSelected] = useState<
    Set<string>
  >(new Set());

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && role) {
      setSelected(
        new Set(
          (role.permissions ?? []).map(
            (p) => p.id,
          ),
        ),
      );
    }
  }, [open, role]);

  function toggle(permissionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  }

  async function handleSubmit() {
    if (!role) return;

    try {
      setLoading(true);

      await RoleService.updatePermissions(
        role.id,
        Array.from(selected),
      );

      toast.success(
        `Permissions updated for ${role.name}.`,
      );

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to update permissions.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={`Permissions${
        role ? ` — ${role.name}` : ""
      }`}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={handleSubmit}
    >
      <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto">
        {permissions.map((permission) => (
          <label
            key={permission.id}
            className="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.has(
                permission.id,
              )}
              disabled={loading}
              onChange={() =>
                toggle(permission.id)
              }
            />
            {label(permission.code)}
          </label>
        ))}
      </div>
    </ERPFormDialog>
  );
}
