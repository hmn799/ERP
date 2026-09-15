"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ERPTransactionGrid from "@/components/erp/transaction/ERPTransactionGrid";
import TransactionRow from "@/components/erp/transaction/TransactionRow";
import TransactionFooter from "@/components/erp/transaction/TransactionFooter";

import {
  TransactionRowModel,
} from "@/components/erp/transaction/transaction.types";

import {
  calculatePurchaseTotals,
} from "@/core/pricing/purchase.totals";

import {
  getSuppliers,
  getWarehouses,
  getItemLookup,
  SupplierLookup,
  WarehouseLookup,
  ItemLookup,
} from "@/features/purchase/services/purchase.service";

import {
  createPurchaseOrder,
} from "../services/purchase-order.service";

interface Props {}

export default function PurchaseOrderPage(
  {}: Props,
) {
  const router = useRouter();

  const [suppliers, setSuppliers] =
    useState<SupplierLookup[]>([]);

  const [warehouses, setWarehouses] =
    useState<WarehouseLookup[]>([]);

  const [items, setItems] =
    useState<ItemLookup[]>([]);

  const [supplierId, setSupplierId] =
    useState("");

  const [warehouseId, setWarehouseId] =
    useState("");

  const [orderDate, setOrderDate] =
    useState(
      new Date()
        .toISOString()
        .substring(0, 10),
    );

  const [expectedDate, setExpectedDate] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const [rows, setRows] =
    useState<TransactionRowModel[]>([
      createEmptyRow(),
    ]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function createEmptyRow(): TransactionRowModel {
    return {
      id: crypto.randomUUID(),

      barcode: "",

      itemId: "",
      itemCode: "",
      itemName: "",

      batchId: "",
      batchNo: "",

      qty: 0,
      freeQty: 0,

      purchaseRate: 0,
      retailRate: 0,
      wholesaleRate: 0,
      distributorRate: 0,

      mrp: 0,

      gstPercent: 0,
      discountPercent: 0,

      taxableAmount: 0,

      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,

      netAmount: 0,
    };
  }

  useEffect(() => {
    async function loadLookups() {
      try {
        setLoading(true);
        setError(null);

        const [
          supplierData,
          warehouseData,
          itemData,
        ] = await Promise.all([
          getSuppliers(),
          getWarehouses(),
          getItemLookup(),
        ]);

        setSuppliers(supplierData);
        setWarehouses(warehouseData);
        setItems(itemData);
      } catch (err) {
        console.error(
          "Failed to load purchase order lookups:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load purchase order data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadLookups();
  }, []);

  function addRow() {
    setRows((prev) => [
      ...prev,
      createEmptyRow(),
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      const updated = prev.filter(
        (_, i) => i !== index,
      );

      return updated.length
        ? updated
        : [createEmptyRow()];
    });
  }

  function updateField(
    index: number,
    field: keyof TransactionRowModel,
    value: string | number,
  ) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) {
          return row;
        }

        const updated = {
          ...row,
          [field]: value,
        };

        return updated;
      }),
    );
  }

  function updateRow(
    index: number,
    row: TransactionRowModel,
  ) {
    setRows((prev) =>
      prev.map((existing, i) =>
        i === index
          ? row
          : existing,
      ),
    );
  }

  function handleItemSelected(
    index: number,
    item: ItemLookup,
  ) {
    updateRow(index, {
      ...rows[index],

      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,

      barcode:
        item.barcode ?? "",

      purchaseRate:
        item.purchaseRate,

      retailRate:
        item.retailRate,

      wholesaleRate:
        item.wholesaleRate,

      distributorRate:
        item.distributorRate,

      mrp: item.mrp,

      gstPercent:
        item.gstPercent,
    });
  }

  function clearForm() {
    setSupplierId("");
    setWarehouseId("");

    setOrderDate(
      new Date()
        .toISOString()
        .substring(0, 10),
    );

    setExpectedDate("");
    setRemarks("");

    setRows([
      createEmptyRow(),
    ]);

    setError(null);
  }

  async function savePurchaseOrder() {
    try {
      setError(null);

      if (!supplierId) {
        setError(
          "Please select a supplier.",
        );
        return;
      }

      if (!warehouseId) {
        setError(
          "Please select a warehouse.",
        );
        return;
      }

      const validRows =
        rows.filter(
          (row) =>
            row.itemId &&
            Number(row.qty) > 0,
        );

      if (validRows.length === 0) {
        setError(
          "Please add at least one item with quantity.",
        );
        return;
      }

      setSaving(true);

      const dto = {
        supplierId,
        warehouseId,

        orderDate,

        ...(expectedDate
          ? { expectedDate }
          : {}),

        ...(remarks.trim()
          ? {
              remarks:
                remarks.trim(),
            }
          : {}),

        items: validRows.map(
          (row) => ({
            itemId: row.itemId,

            qtyOrdered:
              Number(row.qty),

            purchaseRate:
              Number(
                row.purchaseRate,
              ),

            discountPercent:
              Number(
                row.discountPercent,
              ),

            gstPercent:
              Number(
                row.gstPercent,
              ),
          }),
        ),
      };

      const created =
        await createPurchaseOrder(
          dto,
        );

      router.push(
        `/purchase-order/view/${created.id}`,
      );
    } catch (err) {
      console.error(
        "Failed to create purchase order:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create purchase order.",
      );
    } finally {
      setSaving(false);
    }
  }

  const totals =
    calculatePurchaseTotals(rows);

  if (loading) {
    return (
      <div className="p-6">
        Loading purchase order...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            New Purchase Order
          </h1>

          <p className="text-sm text-gray-500">
            Create a new purchase order
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/purchase-order/list",
            )
          }
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ORDER HEADER */}

      <div className="rounded-lg border bg-white p-4">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Order Date
            </label>

            <input
              type="date"
              value={orderDate}
              onChange={(e) =>
                setOrderDate(
                  e.target.value,
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Expected Date
            </label>

            <input
              type="date"
              value={expectedDate}
              onChange={(e) =>
                setExpectedDate(
                  e.target.value,
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Supplier
            </label>

            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(
                  e.target.value,
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">
                Select Supplier
              </option>

              {suppliers.map(
                (supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.supplierCode} -{" "}
                    {supplier.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Warehouse
            </label>

            <select
              value={warehouseId}
              onChange={(e) =>
                setWarehouseId(
                  e.target.value,
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">
                Select Warehouse
              </option>

              {warehouses.map(
                (warehouse) => (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="md:col-span-2">

            <label className="mb-1 block text-xs font-medium text-gray-600">
              Remarks
            </label>

            <textarea
              value={remarks}
              onChange={(e) =>
                setRemarks(
                  e.target.value,
                )
              }
              rows={2}
              placeholder="Optional remarks..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />

          </div>

        </div>

      </div>

      {/* ITEMS */}

      <ERPTransactionGrid
        title="Purchase Order Items"
        data={rows}
        onAddRow={addRow}
      >

        <thead className="sticky top-0 z-10 border-b bg-slate-100">

          <tr className="text-xs font-semibold uppercase">

            <th className="w-28 p-2 text-left">
              Barcode
            </th>

            <th className="min-w-[260px] p-2 text-left">
              Item
            </th>

            <th className="w-20 p-2 text-right">
              Qty
            </th>

            <th className="w-24 p-2 text-right">
              P.Rate
            </th>

            <th className="w-20 p-2 text-right">
              Discount
            </th>

            <th className="w-16 p-2 text-center">
              GST
            </th>

            <th className="w-28 p-2 text-right">
              Net
            </th>

            <th className="w-16 p-2 text-center">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {rows.map(
            (row, index) => (
              <TransactionRow
                key={row.id}
                row={row}
                index={index}
                mode="purchase"
                onChange={
                  updateField
                }
                onItemSelected={
                  handleItemSelected
                }
                onDelete={
                  removeRow
                }
              />
            ),
          )}

        </tbody>

      </ERPTransactionGrid>

      <TransactionFooter
        totals={totals}
      />

      {/* ACTIONS */}

      <div className="flex justify-end gap-3">

        <button
          type="button"
          onClick={clearForm}
          disabled={saving}
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={savePurchaseOrder}
          disabled={saving}
          className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Purchase Order"}
        </button>

      </div>

    </div>
  );
}
