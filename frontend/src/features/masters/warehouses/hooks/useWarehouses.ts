"use client";

import { useQuery } from "@tanstack/react-query";

import warehouseService from "@/services/warehouse/warehouse.service";

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getAll,
  });
}