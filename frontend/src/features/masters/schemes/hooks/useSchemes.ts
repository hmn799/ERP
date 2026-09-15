"use client";

import { useQuery } from "@tanstack/react-query";

import SchemeService from "@/services/scheme/scheme.service";
import itemService from "@/services/item/item.service";

export function useSchemes() {
  return useQuery({
    queryKey: ["schemes"],
    queryFn: SchemeService.getAll,
  });
}

export function useSchemeItems() {
  return useQuery({
    queryKey: ["schemes", "items"],
    queryFn: itemService.getAll,
  });
}
