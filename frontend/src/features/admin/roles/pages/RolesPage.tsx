"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useRoles } from "../hooks/useRoles";
import RoleTable from "../components/RoleTable";
import RoleDialog from "../components/RoleDialog";
import PermissionsDialog from "../components/PermissionsDialog";

import roleService from "@/services/role/role.service";

import type { Role } from "@/services/role/role.service";

export default function RolesPage() {
  const { data = [], isLoading, refetch } = useRoles();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] =
    useState(false);

  const [selected, setSelected] = useState<Role>();

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function deleteRole() {
    if (!selected) return;

    try {
      await roleService.remove(selected.id);

      toast.success("Role deleted");

      setDeleteOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to delete role. Roles with users assigned must be reassigned first.",
      );
    }
  }

  const filtered = data.filter((role: Role) =>
    role.name
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Roles
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage roles and which permissions each one
          grants.
        </p>
      </div>

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Roles..."
        onSearch={setSearch}
        addLabel="Add Role"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
      />

      <RoleTable
        data={filtered}
        loading={isLoading}
        onEdit={(role) => {
          setSelected(role);
          setDialogOpen(true);
        }}
        onPermissions={(role) => {
          setSelected(role);
          setPermissionsOpen(true);
        }}
        onDelete={(role) => {
          setSelected(role);
          setDeleteOpen(true);
        }}
      />

      <RoleDialog
        open={dialogOpen}
        role={selected}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <PermissionsDialog
        open={permissionsOpen}
        role={selected}
        onOpenChange={setPermissionsOpen}
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Role"
        description={`Delete "${selected?.name}" ?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteRole}
      />
    </div>
  );
}
