"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { AccountGroupService } from "@/services/account-group/account-group.service";

import type { AccountGroup } from "../types/account-group.types";
import AccountGroupForm, {
  AccountGroupFormValues,
} from "./AccountGroupForm";

interface AccountGroupDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  accountGroup?: AccountGroup;

  onSuccess?(): void;
}

export default function AccountGroupDialog({
  open,
  onOpenChange,
  accountGroup,
  onSuccess,
}: AccountGroupDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: AccountGroupFormValues,
  ) {
    try {
      setLoading(true);

      if (accountGroup) {
        await AccountGroupService.update(
          accountGroup.id,
          values,
        );

        toast.success(
          "Account group updated successfully.",
        );
      } else {
        await AccountGroupService.create(values);

        toast.success(
          "Account group created successfully.",
        );
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to save account group.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={
        accountGroup
          ? "Edit Account Group"
          : "New Account Group"
      }
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "account-group-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <AccountGroupForm
        defaultValues={
          accountGroup
            ? {
                name: accountGroup.name,
                natureType: accountGroup.natureType,
                description:
                  accountGroup.description ??
                  undefined,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}
