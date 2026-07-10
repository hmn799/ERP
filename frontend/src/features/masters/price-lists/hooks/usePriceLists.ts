"use client";

import { useQuery } from "@tanstack/react-query";

import priceListService from "@/services/price-list/price-list.service";

export function usePriceLists() {
  return useQuery({
    queryKey: ["price-lists"],
    queryFn: priceListService.getAll,
  });
}