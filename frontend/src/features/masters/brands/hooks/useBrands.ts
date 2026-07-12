"use client";

import { useQuery } from "@tanstack/react-query";

import brandService from "@/services/brand/brand.service";
export function useBrands() {
  return useQuery({
    queryKey: ["brands"],

    queryFn: () => brandService.getAll(),
  });
}