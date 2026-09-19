"use client";

import { useQuery } from "@tanstack/react-query";

import stockTransferService from "@/services/stock-transfer/stock-transfer.service";

export function useStockTransfers() {
  return useQuery({
    queryKey: ["stock-transfers"],
    queryFn: stockTransferService.list,
  });
}
