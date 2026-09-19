"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { UserService } from "@/services/user/user.service";

import type { User } from "../types/user.types";
import UserForm, {
  UserFormValues,
} from "./UserForm";

interface UserDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  user?: User;

  onSuccess?(): void;
}

export default function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: UserFormValues,
  ) {
    if (!values.roleId) {
      toast.error("Select a role.");
      return;
    }

    try {
      setLoading(true);

      if (user) {
        await UserService.update(user.id, {
          fullName: values.fullName,
          mobile: values.mobile || undefined,
          roleId: values.roleId,
          isActive: values.isActive,
        });

        toast.success(
          "User updated successfully.",
        );
      } else {
        if (!values.username.trim()) {
          toast.error("Enter a username.");
          setLoading(false);
          return;
        }

        if (values.password.length < 6) {
          toast.error(
            "Password must be at least 6 characters.",
          );
          setLoading(false);
          return;
        }

        await UserService.create({
          username: values.username.trim(),
          password: values.password,
          fullName: values.fullName,
          mobile: values.mobile || undefined,
          roleId: values.roleId,
          isActive: values.isActive,
        });

        toast.success(
          "User created successfully.",
        );
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={user ? "Edit User" : "New User"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "user-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <UserForm
        isEditMode={Boolean(user)}
        defaultValues={
          user
            ? {
                username: user.username,
                password: "",
                fullName: user.fullName,
                mobile: user.mobile ?? "",
                roleId: user.roleId,
                isActive: user.isActive,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}
