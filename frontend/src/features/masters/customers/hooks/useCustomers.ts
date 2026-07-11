"use client";

import { useQuery } from "@tanstack/react-query";

import customerService from "@/services/customer/customer.service";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAll,
  });
}