"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { UserService } from "@/services/user/user.service";

import type { User } from "../types/user.types";

interface ResetPasswordDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  user?: User;
}

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!user) return;

    if (password.length < 6) {
      toast.error(
        "Password must be at least 6 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      await UserService.resetPassword(
        user.id,
        password,
      );

      toast.success(
        `Password reset for ${user.username}.`,
      );

      onOpenChange(false);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to reset password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={`Reset Password${
        user ? ` — ${user.username}` : ""
      }`}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label required>New Password</Label>

        <Input
          type="password"
          value={password}
          disabled={loading}
          placeholder="Minimum 6 characters"
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />
      </div>
    </ERPFormDialog>
  );
}
