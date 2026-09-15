"use client";

import { useEffect, useMemo, useState } from "react";

import ERPDateFilter from "@/components/erp/filters/ERPDateFilter";
import ERPFilterBar from "@/components/erp/filters/ERPFilterBar";
import ERPResetFilters from "@/components/erp/filters/ERPResetFilters";
import ERPSearchBox from "@/components/erp/search/ERPSearchBox";

import PurchaseReturnListTable from "../components/PurchaseReturnListTable";

import {
  getPurchaseReturns,
} from "../services/purchase-return.service";

import {
  PurchaseReturnListItem,
  PurchaseReturnResponse,
} from "../types/purchase-return.types";

export default function PurchaseReturnListPage() {
  const [
    returns,
    setReturns,
  ] = useState<
    PurchaseReturnResponse[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const pageSize = 50;

  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const result =
          await getPurchaseReturns();

        setReturns(result);
      } catch (error) {
        console.error(
          "Failed to load purchase returns:",
          error,
        );

        alert(
          "Failed to load purchase returns.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // =========================================================
  // NORMALIZE
  // =========================================================

  const listData =
    useMemo<
      PurchaseReturnListItem[]
    >(() => {
      return returns.map(
        (item) => ({
          id: item.id,

          returnNo:
            item.returnNo,

          returnDate:
            item.returnDate,

          purchaseBillId:
            item.purchaseBillId,

          purchaseBillNo:
            item.purchaseBill?.billNo ??
            "-",

          supplierId:
            item.supplierId,

          supplierName:
            item.supplier?.name ??
            "-",

          warehouseId:
            item.warehouseId,

          warehouseName:
            item.warehouse?.name ??
            "-",

          totalItems:
            item.items?.length ?? 0,

          totalQty:
            item.items?.reduce(
              (
                total,
                returnItem,
              ) =>
                total +
                Number(
                  returnItem.qty,
                ),
              0,
            ) ?? 0,

          grossAmount:
            Number(
              item.grossAmount,
            ),

          taxableAmount:
            Number(
              item.taxableAmount,
            ),

          cgstAmount:
            Number(
              item.cgstAmount,
            ),

          sgstAmount:
            Number(
              item.sgstAmount,
            ),

          igstAmount:
            Number(
              item.igstAmount,
            ),

          netAmount:
            Number(
              item.netAmount,
            ),
        }),
      );
    }, [returns]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredData =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return listData.filter(
        (item) => {
          // -----------------------------------------------
          // SEARCH
          // -----------------------------------------------

          if (searchText) {
            const matchesSearch =
              item.returnNo
                .toLowerCase()
                .includes(searchText) ||
              item.purchaseBillNo
                .toLowerCase()
                .includes(searchText) ||
              item.supplierName
                .toLowerCase()
                .includes(searchText);

            if (!matchesSearch) {
              return false;
            }
          }

          // -----------------------------------------------
          // FROM DATE
          // -----------------------------------------------

          if (fromDate) {
            const itemDate =
              new Date(
                item.returnDate,
              )
                .toISOString()
                .substring(
                  0,
                  10,
                );

            if (
              itemDate <
              fromDate
            ) {
              return false;
            }
          }

          // -----------------------------------------------
          // TO DATE
          // -----------------------------------------------

          if (toDate) {
            const itemDate =
              new Date(
                item.returnDate,
              )
                .toISOString()
                .substring(
                  0,
                  10,
                );

            if (
              itemDate >
              toDate
            ) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      listData,
      search,
      fromDate,
      toDate,
    ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const total =
    filteredData.length;

  const totalPages =
    Math.max(
      Math.ceil(
        total / pageSize,
      ),
      1,
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const paginatedData =
    filteredData.slice(
      (safePage - 1) *
        pageSize,

      safePage *
        pageSize,
    );

  // =========================================================
  // RESET
  // =========================================================

  function resetFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Purchase Returns
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Purchase return history
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          {total} Records
        </div>

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <ERPFilterBar>

        <ERPSearchBox
          value={search}
          onChange={(value) => {
            setPage(1);
            setSearch(value);
          }}
          placeholder="Search Return / Bill / Supplier..."
        />

        <ERPDateFilter
          value={fromDate}
          onChange={(value) => {
            setPage(1);
            setFromDate(value);
          }}
          label="From Date"
        />

        <ERPDateFilter
          value={toDate}
          onChange={(value) => {
            setPage(1);
            setToDate(value);
          }}
          label="To Date"
        />

        <ERPResetFilters
          onClick={resetFilters}
        />

      </ERPFilterBar>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <PurchaseReturnListTable
        data={paginatedData}
        loading={loading}
      />

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">

          <div className="text-sm text-muted-foreground">
            Page {safePage} of{" "}
            {totalPages}
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              disabled={
                safePage <= 1
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      current - 1,
                      1,
                    ),
                )
              }
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                safePage >=
                totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      current + 1,
                      totalPages,
                    ),
                )
              }
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>

          </div>

        </div>
      )}

    </div>
  );
}