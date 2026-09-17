"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import ERPComboBox from "@/components/erp/lookup/ERPComboBox";

import {
  createSupplier,
  getSuppliers,
  getWarehouses,
  SupplierLookup,
  WarehouseLookup,
} from "../services/purchase.service";

const GST_MODE_OPTIONS = [
  {
    value: "EXCLUSIVE",
    label: "Exclusive (rate + GST)",
  },
  {
    value: "INCLUSIVE",
    label: "Inclusive (rate includes GST)",
  },
];

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

  /*
   * Fires once the header's last field (GST Mode) is done - lets
   * the page hand focus off into the Items grid so the whole
   * screen reads as one continuous flow: Invoice No -> Bill Date
   * -> Supplier -> Warehouse -> GST Mode -> first item row.
   */
  onHeaderComplete?(): void;
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
  onHeaderComplete,
}: Props) {
  const [suppliers, setSuppliers] =
    useState<SupplierLookup[]>([]);

  const [warehouses, setWarehouses] =
    useState<WarehouseLookup[]>([]);

  const [
    showCreateSupplier,
    setShowCreateSupplier,
  ] = useState(false);

  const [
    creatingSupplier,
    setCreatingSupplier,
  ] = useState(false);

  const [
    createSupplierError,
    setCreateSupplierError,
  ] = useState("");

  const [newSupplierName, setNewSupplierName] =
    useState("");

  const [
    newSupplierGstType,
    setNewSupplierGstType,
  ] = useState("UNREGISTERED");

  const [newSupplierGstin, setNewSupplierGstin] =
    useState("");

  const [
    newSupplierMobile,
    setNewSupplierMobile,
  ] = useState("");

  const invoiceNoRef =
    useRef<HTMLInputElement>(null);

  const billDateRef =
    useRef<HTMLInputElement>(null);

  const supplierRef =
    useRef<HTMLInputElement>(null);

  const warehouseRef =
    useRef<HTMLInputElement>(null);

  const taxModeRef =
    useRef<HTMLInputElement>(null);

  /*
   * Opening the entry screen should put the cursor where data
   * entry naturally starts, instead of making the operator click
   * in - mirrors the same "ready to type" behavior the Items grid
   * already has for its own fields.
   */
  useEffect(() => {
    invoiceNoRef.current?.focus();
  }, []);

  function handleEnterAdvance(
    event: React.KeyboardEvent,
    next: React.RefObject<HTMLInputElement | null>,
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    next.current?.focus();
  }

  function openCreateSupplier(
    searchText: string,
  ) {
    setNewSupplierName(searchText);
    setNewSupplierGstType("UNREGISTERED");
    setNewSupplierGstin("");
    setNewSupplierMobile("");
    setCreateSupplierError("");
    setShowCreateSupplier(true);
  }

  async function handleCreateSupplier() {
    const name = newSupplierName.trim();

    if (!name) {
      return;
    }

    try {
      setCreatingSupplier(true);
      setCreateSupplierError("");

      const created = await createSupplier({
        name,
        gstType: newSupplierGstType,
        gstin:
          newSupplierGstin.trim() ||
          undefined,
        mobile:
          newSupplierMobile.trim() ||
          undefined,
      });

      setSuppliers((current) => [
        ...current,
        created,
      ]);

      onSupplierChange(created.id);

      setShowCreateSupplier(false);

      warehouseRef.current?.focus();
    } catch (error) {
      console.error(
        "Failed to create supplier:",
        error,
      );

      setCreateSupplierError(
        "Failed to create supplier. Please try again.",
      );
    } finally {
      setCreatingSupplier(false);
    }
  }

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
    <>
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
            ref={invoiceNoRef}
            className={inputClass}
            placeholder="Enter invoice number"
            value={invoiceNo}
            onChange={(event) =>
              onInvoiceNoChange(event.target.value)
            }
            onKeyDown={(event) =>
              handleEnterAdvance(event, billDateRef)
            }
          />
        </Field>

        <Field label="Bill Date">
          <Input
            ref={billDateRef}
            className={inputClass}
            type="date"
            value={billDate}
            onChange={(event) =>
              onBillDateChange(event.target.value)
            }
            onKeyDown={(event) =>
              handleEnterAdvance(event, supplierRef)
            }
          />
        </Field>

        <Field label="Supplier">
          <ERPComboBox
            ref={supplierRef}
            className={inputClass}
            placeholder="Select Supplier"
            value={supplierId}
            options={suppliers.map(
              (supplier) => ({
                value: supplier.id,
                label: `${supplier.supplierCode} - ${supplier.name}`,
              }),
            )}
            onSelect={onSupplierChange}
            onAdvance={() =>
              warehouseRef.current?.focus()
            }
            onCreateNew={openCreateSupplier}
            createNewLabel="+ Create new supplier"
          />
        </Field>

        <Field label="Warehouse">
          <ERPComboBox
            ref={warehouseRef}
            className={inputClass}
            placeholder="Select Warehouse"
            value={warehouseId}
            options={warehouses.map(
              (warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
              }),
            )}
            onSelect={onWarehouseChange}
            onAdvance={() =>
              taxModeRef.current?.focus()
            }
          />
        </Field>

        <Field label="GST Mode">
          <ERPComboBox
            ref={taxModeRef}
            className={inputClass}
            placeholder="Select GST Mode"
            value={taxMode}
            options={GST_MODE_OPTIONS}
            onSelect={(value) =>
              onTaxModeChange(
                value as
                  | "EXCLUSIVE"
                  | "INCLUSIVE",
              )
            }
            onAdvance={onHeaderComplete}
          />
        </Field>
      </div>
    </section>

    {/* CREATE SUPPLIER MODAL */}

    {showCreateSupplier && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
          <div className="border-b px-5 py-4">
            <h3 className="text-lg font-semibold">
              Create Supplier
            </h3>

            <p className="text-sm text-gray-500">
              Create without leaving the
              purchase entry screen. The
              supplier code is generated
              automatically.
            </p>
          </div>

          <div className="space-y-4 p-5">
            {createSupplierError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {createSupplierError}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Name *
              </label>

              <input
                autoFocus
                value={newSupplierName}
                onChange={(event) =>
                  setNewSupplierName(
                    event.target.value,
                  )
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  GST Type
                </label>

                <select
                  value={
                    newSupplierGstType
                  }
                  onChange={(event) =>
                    setNewSupplierGstType(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="UNREGISTERED">
                    Unregistered
                  </option>
                  <option value="REGISTERED">
                    Registered
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Mobile
                </label>

                <input
                  value={newSupplierMobile}
                  onChange={(event) =>
                    setNewSupplierMobile(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                GSTIN
              </label>

              <input
                value={newSupplierGstin}
                onChange={(event) =>
                  setNewSupplierGstin(
                    event.target.value,
                  )
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t px-5 py-4">
            <button
              type="button"
              disabled={creatingSupplier}
              onClick={() =>
                setShowCreateSupplier(false)
              }
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                creatingSupplier ||
                !newSupplierName.trim()
              }
              onClick={
                handleCreateSupplier
              }
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creatingSupplier
                ? "Creating..."
                : "Create Supplier"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
