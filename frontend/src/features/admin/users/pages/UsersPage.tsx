"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useUsers } from "../hooks/useUsers";
import UserTable from "../components/UserTable";
import UserDialog from "../components/UserDialog";
import ResetPasswordDialog from "../components/ResetPasswordDialog";

import userService from "@/services/user/user.service";

import { User } from "../types/user.types";

export default function UsersPage() {
  const { data = [], isLoading, refetch } = useUsers();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<User>();

  const [resetPasswordOpen, setResetPasswordOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteUser() {
    if (!selected) return;

    try {
      await userService.remove(selected.id);

      toast.success("User deleted");

      setDeleteOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error("Unable to delete user");
    }
  }

  const filtered = data.filter(
    (user: User) =>
      user.username
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      user.fullName
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search Users..."
        onSearch={setSearch}
        addLabel="Add User"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <UserTable
        data={filtered}
        loading={isLoading}
        onEdit={(user) => {
          setSelected(user);
          setDialogOpen(true);
        }}
        onResetPassword={(user) => {
          setSelected(user);
          setResetPasswordOpen(true);
        }}
        onDelete={(user) => {
          setSelected(user);
          setDeleteOpen(true);
        }}
      />

      <UserDialog
        open={dialogOpen}
        user={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ResetPasswordDialog
        open={resetPasswordOpen}
        user={selected}
        onOpenChange={setResetPasswordOpen}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete User"
        description={`Delete "${selected?.username}" ? This cannot be undone.`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteUser}
      />
    </div>
  );
}
