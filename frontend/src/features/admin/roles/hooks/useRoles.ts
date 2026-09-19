"use client";

import { useQuery } from "@tanstack/react-query";

import roleService from "@/services/role/role.service";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: roleService.getAll,
  });
}
