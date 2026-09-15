"use client";

import { useEffect, useState } from "react";

import {
  getSuppliers,
  SupplierLookup,
} from "@/features/purchase/services/purchase.service";

export function useSupplierLookup() {
  const [suppliers, setSuppliers] = useState<
    SupplierLookup[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  async function load() {
    try {
      setLoading(true);

      const data =
        await getSuppliers();

      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    suppliers,
    loading,
    reload: load,
  };
}