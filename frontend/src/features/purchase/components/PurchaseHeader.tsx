"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import {
  getSuppliers,
  getWarehouses,
  SupplierLookup,
  WarehouseLookup,
} from "../services/purchase.service";

interface Props {
  supplierId: string;
  warehouseId: string;
  billDate: string;
  invoiceNo: string;

  onSupplierChange(value: string): void;
  onWarehouseChange(value: string): void;
  onBillDateChange(value: string): void;
  onInvoiceNoChange(value: string): void;
}

export default function PurchaseHeader({
  supplierId,
  warehouseId,
  billDate,
  invoiceNo,
  onSupplierChange,
  onWarehouseChange,
  onBillDateChange,
  onInvoiceNoChange,
}: Props) {
  const [suppliers, setSuppliers] = useState<
    SupplierLookup[]
  >([]);

  const [warehouses, setWarehouses] =
  useState<WarehouseLookup[]>([]);

  useEffect(() => {
  getSuppliers()
    .then(setSuppliers)
    .catch(console.error);

  getWarehouses()
    .then(setWarehouses)
    .catch(console.error);
}, []);


  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">

      <Input
        type="date"
        value={billDate}
        onChange={(e) =>
          onBillDateChange(e.target.value)
        }
      />

      <Input
        placeholder="Invoice Number"
        value={invoiceNo}
        onChange={(e) =>
          onInvoiceNoChange(e.target.value)
        }
      />

      <select
        className="h-10 rounded-md border bg-background px-3"
        value={supplierId}
        onChange={(e) =>
          onSupplierChange(e.target.value)
        }
      >
        <option value="">
          Select Supplier
        </option>

        {suppliers.map((supplier) => (
          <option
            key={supplier.id}
            value={supplier.id}
          >
            {supplier.supplierCode} - {supplier.name}
          </option>
        ))}
      </select>

      <select
  className="h-10 rounded-md border bg-background px-3"
  value={warehouseId}
  onChange={(e) =>
    onWarehouseChange(e.target.value)
  }
>
  <option value="">
    Select Warehouse
  </option>

  {warehouses.map((warehouse) => (
    <option
      key={warehouse.id}
      value={warehouse.id}
    >
      {warehouse.name}
    </option>
  ))}
</select>

    </div>
  );
}