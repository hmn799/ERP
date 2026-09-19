"use client";

import { useQuery } from "@tanstack/react-query";

import financialYearService from "@/services/financial-year/financial-year.service";

export function useFinancialYears() {
  return useQuery({
    queryKey: ["financial-years"],
    queryFn: financialYearService.list,
  });
}
