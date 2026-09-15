"use client";

import { useEffect, useState } from "react";

import { useDebounce } from "./useDebounce";

import {
  ERPListFetcher,
  ERPListQuery,
} from "../types/erp-list.types";

export function useERPList<T>(
  fetcher: ERPListFetcher<T>,
  initialQuery?: Partial<ERPListQuery>,
) {
  const [data, setData] =
    useState<T[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] =
    useState(initialQuery?.page ?? 1);

  const [pageSize, setPageSize] =
    useState(initialQuery?.pageSize ?? 50);

  const [search, setSearch] =
    useState(initialQuery?.search ?? "");

  const debouncedSearch =
    useDebounce(search, 300);

  const [supplierId, setSupplierId] =
    useState("");

  const [warehouseId, setWarehouseId] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [sortBy, setSortBy] =
    useState("billDate");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  const [total, setTotal] =
    useState(0);

  async function load() {
    try {
      setLoading(true);

      const result = await fetcher({
        page,
        pageSize,

        search: debouncedSearch,

        supplierId,
        warehouseId,

        status,

        fromDate,
        toDate,

        sortBy,
        sortOrder,
      });

      setData(result.data);

      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [
    page,
    pageSize,

    debouncedSearch,

    supplierId,
    warehouseId,

    status,

    fromDate,
    toDate,

    sortBy,
    sortOrder,
  ]);

  function resetFilters() {
    setPage(1);

    setSearch("");

    setSupplierId("");

    setWarehouseId("");

    setStatus("");

    setFromDate("");

    setToDate("");
  }

  return {
    data,

    loading,

    total,

    page,
    setPage,

    pageSize,
    setPageSize,

    search,
    setSearch,

    supplierId,
    setSupplierId,

    warehouseId,
    setWarehouseId,

    status,
    setStatus,

    fromDate,
    setFromDate,

    toDate,
    setToDate,

    sortBy,
    setSortBy,

    sortOrder,
    setSortOrder,

    resetFilters,

    reload: load,
  };
}