"use client";

import { useQuery } from "@tanstack/react-query";

import accountGroupService from "@/services/account-group/account-group.service";

export function useAccountGroups() {
  return useQuery({
    queryKey: ["account-groups"],
    queryFn: accountGroupService.getAll,
  });
}
