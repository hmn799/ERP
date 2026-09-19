"use client";

import { useQuery } from "@tanstack/react-query";

import salesOrderService from "@/services/sales-order/sales-order.service";

export function useSalesOrders() {
  return useQuery({
    queryKey: ["sales-orders"],
    queryFn: salesOrderService.list,
  });
}
