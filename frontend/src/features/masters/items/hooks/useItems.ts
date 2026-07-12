"use client";

import { useQuery } from "@tanstack/react-query";

import itemService from "@/services/item/item.service";

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: itemService.getAll,
  });
}