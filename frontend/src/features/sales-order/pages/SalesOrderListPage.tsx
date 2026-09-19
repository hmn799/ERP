"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";

import { useSalesOrders } from "../hooks/useSalesOrders";
import SalesOrderTable from "../components/SalesOrderTable";

export default function SalesOrderListPage() {
  const router = useRouter();

  const { data = [], isLoading, refetch } = useSalesOrders();

  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (order) =>
      order.soNo.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ERPToolbar
        search={search}
        searchPlaceholder="Search by order no or customer..."
        onSearch={setSearch}
        addLabel="New Sales Order"
        onRefresh={refetch}
        onAdd={() => router.push("/sales-order/new")}
      />

      <SalesOrderTable data={filtered} loading={isLoading} />
    </div>
  );
}
