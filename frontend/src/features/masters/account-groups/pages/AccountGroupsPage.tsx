"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useAccountGroups } from "../hooks/useAccountGroups";
import AccountGroupTable from "../components/AccountGroupTable";
import AccountGroupDialog from "../components/AccountGroupDialog";

import accountGroupService from "@/services/account-group/account-group.service";

import { AccountGroup } from "../types/account-group.types";

export default function AccountGroupsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useAccountGroups();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selected, setSelected] =
    useState<AccountGroup>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteAccountGroup() {
    if (!selected) return;

    try {
      await accountGroupService.remove(
        selected.id,
      );

      toast.success("Account group deleted");

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error(
        "Unable to delete account group",
      );
    }
  }

  const filtered = data.filter(
    (group: AccountGroup) =>
      group.name
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search Account Groups..."
        onSearch={setSearch}
        addLabel="Add Account Group"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <AccountGroupTable
        data={filtered}
        loading={isLoading}
        onEdit={(group) => {
          setSelected(group);
          setDialogOpen(true);
        }}
        onDelete={(group) => {
          setSelected(group);
          setDeleteOpen(true);
        }}
      />

      <AccountGroupDialog
        open={dialogOpen}
        accountGroup={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Account Group"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAccountGroup}
      />
    </div>
  );
}
