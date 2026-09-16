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
  isEditMode?: boolean;
  status?: string;
  isCancelled?: boolean;

  supplierId: string;
  warehouseId: string;
  billDate: string;
  invoiceNo: string;
  taxMode: "EXCLUSIVE" | "INCLUSIVE";

  onSupplierChange(value: string): void;
  onWarehouseChange(value: string): void;
  onBillDateChange(value: string): void;
  onInvoiceNoChange(value: string): void;
  onTaxModeChange(
    value: "EXCLUSIVE" | "INCLUSIVE",
  ): void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black";

export default function PurchaseHeader({
  isEditMode = false,
  status = "ACTIVE",
  isCancelled = false,
  supplierId,
  warehouseId,
  billDate,
  invoiceNo,
  taxMode,
  onSupplierChange,
  onWarehouseChange,
  onBillDateChange,
  onInvoiceNoChange,
  onTaxModeChange,
}: Props) {
  const [suppliers, setSuppliers] =
    useState<SupplierLookup[]>([]);

  const [warehouses, setWarehouses] =
    useState<WarehouseLookup[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [supplierData, warehouseData] =
          await Promise.all([
            getSuppliers(),
            getWarehouses(),
          ]);

        if (cancelled) {
          return;
        }

        setSuppliers(supplierData);
        setWarehouses(warehouseData);
      } catch (error) {
        console.error(
          "Failed to load purchase header lookups:",
          error,
        );
      }
    }

    loadLookups();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Edit Purchase" : "New Purchase"}
          </h2>

          <p className="text-sm text-gray-500">
            {isEditMode
              ? "Editing purchase bill"
              : "Purchase stock receipt"}
          </p>
        </div>

        {isEditMode && (
          <span
            className={
              isCancelled
                ? "rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                : "rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
            }
          >
            {status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Field label="Invoice No.">
          <Input
            className={inputClass}
            placeholder="Enter invoice number"
            value={invoiceNo}
            onChange={(event) =>
              onInvoiceNoChange(event.target.value)
            }
          />
        </Field>

        <Field label="Bill Date">
          <Input
            className={inputClass}
            type="date"
            value={billDate}
            onChange={(event) =>
              onBillDateChange(event.target.value)
            }
          />
        </Field>

        <Field label="Supplier">
          <select
            className={inputClass}
            value={supplierId}
            onChange={(event) =>
              onSupplierChange(event.target.value)
            }
          >
            <option value="">Select Supplier</option>

            {suppliers.map((supplier) => (
              <option
                key={supplier.id}
                value={supplier.id}
              >
                {supplier.supplierCode} - {supplier.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Warehouse">
          <select
            className={inputClass}
            value={warehouseId}
            onChange={(event) =>
              onWarehouseChange(event.target.value)
            }
          >
            <option value="">Select Warehouse</option>

            {warehouses.map((warehouse) => (
              <option
                key={warehouse.id}
                value={warehouse.id}
              >
                {warehouse.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="GST Mode">
          <select
            className={inputClass}
            value={taxMode}
            onChange={(event) =>
              onTaxModeChange(
                event.target.value as
                  | "EXCLUSIVE"
                  | "INCLUSIVE",
              )
            }
          >
            <option value="EXCLUSIVE">
              Exclusive (rate + GST)
            </option>
            <option value="INCLUSIVE">
              Inclusive (rate includes GST)
            </option>
          </select>
        </Field>
      </div>
    </section>
  );
}
