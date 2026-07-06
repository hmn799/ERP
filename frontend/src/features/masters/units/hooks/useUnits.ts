"use client";

import { useQuery } from "@tanstack/react-query";

import { UnitService } from "@/services/unit/unit.service";

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: UnitService.getAll,
  });
}