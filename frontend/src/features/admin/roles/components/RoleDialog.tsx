"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { RoleService } from "@/services/role/role.service";

import type { Role } from "@/services/role/role.service";
import RoleForm, {
  RoleFormValues,
} from "./RoleForm";

interface RoleDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  role?: Role;

  onSuccess?(): void;
}

export default function RoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: RoleFormValues,
  ) {
    if (!values.name.trim()) {
      toast.error("Enter a role name.");
      return;
    }

    try {
      setLoading(true);

      if (role) {
        await RoleService.update(role.id, {
          name: values.name.trim(),
        });

        toast.success(
          "Role updated successfully.",
        );
      } else {
        await RoleService.create({
          name: values.name.trim(),
        });

        toast.success(
          "Role created successfully.",
        );
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save role.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={role ? "Rename Role" : "New Role"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "role-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <RoleForm
        defaultValues={
          role ? { name: role.name } : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}
