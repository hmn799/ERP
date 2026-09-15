"use client";

import { useEffect, useState } from "react";

import {
  getWarehouses,
  WarehouseLookup,
} from "@/features/purchase/services/purchase.service";

export function useWarehouseLookup() {
  const [warehouses, setWarehouses] =
    useState<WarehouseLookup[]>([]);

  useEffect(() => {
    getWarehouses().then(setWarehouses);
  }, []);

  return {
    warehouses,
  };
}