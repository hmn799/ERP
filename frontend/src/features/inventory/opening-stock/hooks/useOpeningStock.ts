"use client";

import { useQuery } from "@tanstack/react-query";

import openingStockService from "@/services/opening-stock/opening-stock.service";

export function useOpeningStock() {
  return useQuery({
    queryKey: ["opening-stock"],
    queryFn: openingStockService.list,
  });
}
