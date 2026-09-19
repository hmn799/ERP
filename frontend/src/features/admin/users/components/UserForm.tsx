"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import RoleService from "@/services/role/role.service";

export interface UserFormValues {
  username: string;
  password: string;
  fullName: string;
  mobile: string;
  roleId: string;
  isActive: boolean;
}

interface UserFormProps {
  defaultValues?: UserFormValues;

  isEditMode?: boolean;

  loading?: boolean;

  onSubmit(values: UserFormValues): void;
}

const EMPTY: UserFormValues = {
  username: "",
  password: "",
  fullName: "",
  mobile: "",
  roleId: "",
  isActive: true,
};

export default function UserForm({
  defaultValues,
  isEditMode = false,
  loading,
  onSubmit,
}: UserFormProps) {
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: RoleService.getAll,
  });

  const [values, setValues] =
    useState<UserFormValues>(EMPTY);

  useEffect(() => {
    setValues(defaultValues ?? EMPTY);
  }, [defaultValues]);

  return (
    <form
      id="user-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit(values);
      }}
    >
      {!isEditMode && (
        <div className="space-y-2">
          <Label required>Username</Label>

          <Input
            value={values.username}
            disabled={loading}
            placeholder="Login username"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                username: e.target.value,
              }))
            }
          />
        </div>
      )}

      {!isEditMode && (
        <div className="space-y-2">
          <Label required>Password</Label>

          <Input
            type="password"
            value={values.password}
            disabled={loading}
            placeholder="Minimum 6 characters"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                password: e.target.value,
              }))
            }
          />
        </div>
      )}

      <div className="space-y-2">
        <Label required>Full Name</Label>

        <Input
          value={values.fullName}
          disabled={loading}
          placeholder="Employee's full name"
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              fullName: e.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Mobile</Label>

        <Input
          value={values.mobile}
          disabled={loading}
          placeholder="Optional"
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              mobile: e.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label required>Role</Label>

        <select
          value={values.roleId}
          disabled={loading}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              roleId: e.target.value,
            }))
          }
          className="h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
        >
          <option value="">
            Select role...
          </option>

          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          disabled={loading}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              isActive: e.target.checked,
            }))
          }
        />
        Active
      </label>
    </form>
  );
}
