"use client";

import ERPDateFilter from "@/components/erp/filters/ERPDateFilter";
import ERPFilterBar from "@/components/erp/filters/ERPFilterBar";
import ERPResetFilters from "@/components/erp/filters/ERPResetFilters";
import ERPSelectFilter from "@/components/erp/filters/ERPSelectFilter";
import ERPStatusFilter from "@/components/erp/filters/ERPStatusFilter";
import ERPPagination from "@/components/erp/pagination/ERPPagination";
import ERPSearchBox from "@/components/erp/search/ERPSearchBox";

import { useERPList } from "@/shared/hooks/useERPList";

import { useSupplierLookup } from "@/shared/hooks/useSupplierLookup";
import { useWarehouseLookup } from "@/shared/hooks/useWarehouseLookup";

import PurchaseListTable from "../components/PurchaseListTable";

import { getPurchaseList } from "../services/purchase.service";

export default function PurchaseListPage() {
  const list = useERPList(
    getPurchaseList,
    {
      page: 1,
      pageSize: 50,
    },
  );

  const {
    suppliers,
  } = useSupplierLookup();

  const {
    warehouses,
  } = useWarehouseLookup();

  return (
    <div className="space-y-6">
      {/* =====================================
          HEADER
      ===================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Purchase Bills
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage purchase bills, filters
            and transactions
          </p>
        </div>

        <span className="text-sm text-muted-foreground">
          {list.total} Records
        </span>
      </div>

      {/* =====================================
          FILTER BAR
      ===================================== */}

      <ERPFilterBar>
        <ERPSearchBox
          value={list.search}
          onChange={(value) => {
            list.setPage(1);
            list.setSearch(value);
          }}
          placeholder="Search Bill / Supplier / Invoice..."
        />

        <ERPSelectFilter
          value={list.supplierId}
          onChange={(value) => {
            list.setPage(1);
            list.setSupplierId(
              value,
            );
          }}
          placeholder="All Suppliers"
          options={suppliers.map(
            (supplier) => ({
              value: supplier.id,
              label: supplier.name,
            }),
          )}
        />

        <ERPSelectFilter
          value={list.warehouseId}
          onChange={(value) => {
            list.setPage(1);
            list.setWarehouseId(
              value,
            );
          }}
          placeholder="All Warehouses"
          options={warehouses.map(
            (warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            }),
          )}
        />

        <ERPStatusFilter
          value={list.status}
          onChange={(value) => {
            list.setPage(1);
            list.setStatus(value);
          }}
        />

        <ERPDateFilter
          value={list.fromDate}
          onChange={(value) => {
            list.setPage(1);
            list.setFromDate(
              value,
            );
          }}
          label="From Date"
        />

        <ERPDateFilter
          value={list.toDate}
          onChange={(value) => {
            list.setPage(1);
            list.setToDate(
              value,
            );
          }}
          label="To Date"
        />

        <ERPSelectFilter
          value={list.sortBy}
          onChange={(value) => {
            list.setPage(1);
            list.setSortBy(value);
          }}
          placeholder="Sort By"
          options={[
            {
              value: "billDate",
              label: "Bill Date",
            },
            {
              value: "billNo",
              label: "Bill No",
            },
            {
              value: "invoiceNo",
              label: "Invoice No",
            },
            {
              value: "netAmount",
              label: "Amount",
            },
            {
              value: "createdAt",
              label: "Created Date",
            },
          ]}
        />

        <ERPSelectFilter
          value={list.sortOrder}
          onChange={(value) => {
            list.setPage(1);

            list.setSortOrder(
              value as
                | "asc"
                | "desc",
            );
          }}
          placeholder="Order"
          options={[
            {
              value: "desc",
              label: "Descending",
            },
            {
              value: "asc",
              label: "Ascending",
            },
          ]}
        />

        <ERPResetFilters
          onClick={
            list.resetFilters
          }
        />
      </ERPFilterBar>

      {/* =====================================
          TABLE
      ===================================== */}

      <PurchaseListTable
        data={list.data}
        loading={list.loading}
      />

      {/* =====================================
          PAGINATION
      ===================================== */}

      <ERPPagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={
          list.setPage
        }
      />
    </div>
  );
}