"use client";

import { useQuery } from "@tanstack/react-query";

import { BrandService } from "@/services/brand/brand.service";

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],

    queryFn: () => BrandService.getAll(),
  });
}