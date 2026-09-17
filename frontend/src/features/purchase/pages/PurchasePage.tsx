"use client";

import { useEffect, useMemo, useState } from "react";

import PurchaseHeader from "../components/PurchaseHeader";
import PurchaseItemsGrid from "../components/PurchaseItemsGrid";
import PurchaseActions from "../components/PurchaseActions";

import { useTransactionGrid } from "@/components/erp/transaction/hooks/useTransactionGrid";
import { TransactionRowModel } from "@/components/erp/transaction/transaction.types";

import { calculatePurchaseTotals } from "@/core/pricing/purchase.totals";

import {
  createPurchase,
  updatePurchase,
  getPurchaseById,
  cancelPurchase,
  CreatePurchaseDto,
} from "../services/purchase.service";

interface PurchasePageProps {
  purchaseId?: string;
}

interface PurchaseItemResponse {
  itemId?: string;
  batchId?: string;
  qty?: number | string;
  freeQty?: number | string;

  purchaseRate?: number | string;
  retailRate?: number | string;
  wholesaleRate?: number | string;
  distributorRate?: number | string;
  mrp?: number | string;

  discountPercent?: number | string;
  gstPercent?: number | string;

  taxableAmount?: number | string;
  cgstAmount?: number | string;
  sgstAmount?: number | string;
  igstAmount?: number | string;
  netAmount?: number | string;

  item?: {
    barcode?: string | null;
    itemCode?: string;
    name?: string;
  };

  batch?: {
    batchNo?: string;
  };
}

interface PurchaseResponse {
  id: string;

  supplierId?: string;
  warehouseId?: string;

  billDate?: string;
  invoiceNo?: string | null;

  status?: string;
  taxMode?: string;

  items: PurchaseItemResponse[];
}


function getNumber(
  value: number | string | undefined,
) {
  return Number(value || 0);
}
export default function PurchasePage({
  purchaseId,
}: PurchasePageProps) {
  const [supplierId, setSupplierId] =
    useState("");

  const [warehouseId, setWarehouseId] =
    useState("");

  const [billDate, setBillDate] =
    useState(
      new Date()
        .toISOString()
        .substring(0, 10),
    );

  const [invoiceNo, setInvoiceNo] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const [status, setStatus] =
    useState("ACTIVE");

  const [error, setError] =
    useState("");

  const [taxMode, setTaxMode] = useState<
    "EXCLUSIVE" | "INCLUSIVE"
  >("EXCLUSIVE");

  const transaction =
    useTransactionGrid(taxMode);

  const isEditMode =
    Boolean(purchaseId);

  const isCancelled =
    status === "CANCELLED";

  const totals = useMemo(
    () =>
      calculatePurchaseTotals(
        transaction.rows,
        taxMode,
      ),
    [transaction.rows, taxMode],
  );

  /*
   * Switching the toggle re-derives every already-entered row's tax
   * fields under the new mode, so the preview stays accurate without
   * requiring the operator to re-touch each row.
   */
  useEffect(() => {
    transaction.recalculateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxMode]);

  useEffect(() => {
    if (!purchaseId) {
      return;
    }

    const id = purchaseId;

    async function loadPurchase() {
      try {
        setLoading(true);

        const purchase =
          (await getPurchaseById(
            id,
          )) as PurchaseResponse;

        setSupplierId(
          purchase.supplierId ?? "",
        );

        setWarehouseId(
          purchase.warehouseId ?? "",
        );

        setStatus(
          purchase.status ?? "ACTIVE",
        );

        setBillDate(
          purchase.billDate
            ? new Date(
                purchase.billDate,
              )
                .toISOString()
                .substring(0, 10)
            : new Date()
                .toISOString()
                .substring(0, 10),
        );

        setInvoiceNo(
          purchase.invoiceNo ?? "",
        );

        const loadedTaxMode =
          purchase.taxMode === "INCLUSIVE"
            ? "INCLUSIVE"
            : "EXCLUSIVE";

        setTaxMode(loadedTaxMode);

        const loadedRows: TransactionRowModel[] =
          purchase.items.map(
            (item: PurchaseItemResponse) => {
              // The stored rate is always tax-exclusive
              // (see purchase-save.service.ts). If this bill
              // was originally entered inclusive, convert it
              // back to the inclusive figure the operator
              // would recognize, so editing round-trips.
              const storedRate = Number(
                item.purchaseRate ?? 0,
              );

              const gstPercent = Number(
                item.gstPercent ?? 0,
              );

              const displayRate =
                loadedTaxMode === "INCLUSIVE" &&
                gstPercent > 0
                  ? storedRate *
                    (1 + gstPercent / 100)
                  : storedRate;

              return {
              id: crypto.randomUUID(),

              barcode:
                item.item?.barcode ??
                "",

              itemId:
                item.itemId ?? "",

              itemCode:
                item.item?.itemCode ??
                "",

              itemName:
                item.item?.name ??
                "",

              batchId:
                item.batchId ?? "",

              batchNo:
                item.batch?.batchNo ??
                "",

              qty:
                Number(item.qty) || 0,

              freeQty:
                Number(
                  item.freeQty ?? 0,
                ),

              purchaseRate: displayRate,

              retailRate:
                Number(
                  item.retailRate ?? 0,
                ),

              wholesaleRate:
                Number(
                  item.wholesaleRate ?? 0,
                ),

              distributorRate:
                Number(
                  item.distributorRate ?? 0,
                ),

              mrp:
                Number(item.mrp ?? 0),

              gstPercent:
                Number(
                  item.gstPercent ?? 0,
                ),

              discountPercent:
                Number(
                  item.discountPercent ??
                    0,
                ),

              taxableAmount:
                Number(
                  item.taxableAmount ??
                    0,
                ),

              cgstAmount:
                Number(
                  item.cgstAmount ?? 0,
                ),

              sgstAmount:
                Number(
                  item.sgstAmount ?? 0,
                ),

              igstAmount:
                Number(
                  item.igstAmount ?? 0,
                ),

              netAmount:
                Number(
                  item.netAmount ?? 0,
                ),
              };
            },
          );

        transaction.setLoadedRows(
          loadedRows,
        );
      } catch (error) {
        console.error(
          "Failed to load purchase:",
          error,
        );

        alert(
          "Failed to load purchase.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPurchase();
  }, [purchaseId]);

  async function handleSave() {
    setError("");

    if (!supplierId) {
      const message = "Please select a supplier.";
      setError(message);
      alert(message);
      return;
    }

    if (!warehouseId) {
      const message = "Please select a warehouse.";
      setError(message);
      alert(message);
      return;
    }

    if (
      isEditMode &&
      status === "CANCELLED"
    ) {
      const message = "Cancelled purchase cannot be edited.";
      setError(message);
      alert(message);
      return;
    }

    const items =
      transaction.rows
        .filter(
          (row) =>
            row.itemId.trim() !== "" &&
            row.qty > 0,
        )
        .map((row) => ({
          itemId: row.itemId,

          batchNo:
            row.batchNo.trim() ||
            "DEFAULT",

          qty: row.qty,

          freeQty: row.freeQty,

          purchaseRate:
            row.purchaseRate,

          retailRate:
            row.retailRate,

          wholesaleRate:
            row.wholesaleRate,

          distributorRate:
            row.distributorRate,

          mrp: row.mrp,

          discountPercent:
            Number(
              row.discountPercent ?? 0,
            ),

          gstPercent:
            row.gstPercent,
        }));

    if (items.length === 0) {
      const message = "Please add at least one purchase item.";
      setError(message);
      alert(message);
      return;
    }

    const dto: CreatePurchaseDto = {
      supplierId,

      warehouseId,

      billDate:
        new Date(
          billDate,
        ).toISOString(),

      invoiceNo,

      billDiscountPercent: 0,

      taxMode,

      items,
    };

    try {
      setSaving(true);

      if (
        isEditMode &&
        purchaseId
      ) {
        await updatePurchase(
          purchaseId,
          dto,
        );

        setError("");
        alert(
          "Purchase updated successfully.",
        );
      } else {
        await createPurchase(dto);

        setError("");
        alert(
          "Purchase saved successfully.",
        );

        transaction.resetRows();

        setSupplierId("");

        setWarehouseId("");

        setInvoiceNo("");

        setBillDate(
          new Date()
            .toISOString()
            .substring(0, 10),
        );
      }
    } catch (error) {
      console.error(
        "Purchase save error:",
        error,
      );

      const message = isEditMode
        ? "Failed to update purchase."
        : "Failed to save purchase.";

      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndNew() {
    await handleSave();
  }

  async function handleCancel() {
    if (!purchaseId) {
      return;
    }

    if (status === "CANCELLED") {
      alert(
        "Purchase is already cancelled.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this purchase?\n\nThis will reverse the stock and supplier ledger entry.",
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      await cancelPurchase(
        purchaseId,
      );

      setError("");
      alert(
        "Purchase cancelled successfully.",
      );

      setStatus("CANCELLED");
    } catch (error) {
      console.error(
        "Purchase cancellation error:",
        error,
      );

      const message = "Failed to cancel purchase.";
      setError(message);
      alert(message);
    } finally {
      setCancelling(false);
    }
  }

  /*
   * Continues the natural flow from the header's last field (GST
   * Mode) into the Items grid's first row - same data-row-index /
   * data-field targeting PurchaseItemsGrid uses internally to hand
   * focus between rows, so the whole screen reads as one sequence:
   * Invoice No -> Bill Date -> Supplier -> Warehouse -> GST Mode ->
   * Barcode (row 1) -> ...
   */
  function focusFirstItemBarcode() {
    const el = document.querySelector(
      'input[data-row-index="0"][data-field="barcode"]',
    ) as HTMLInputElement | null;

    if (el) {
      el.focus();
      el.select();
    }
  }

  function handleClear() {
    if (
      isEditMode &&
      status === "CANCELLED"
    ) {
      return;
    }

    transaction.resetRows();

    setSupplierId("");

    setWarehouseId("");

    setInvoiceNo("");

    setBillDate(
      new Date()
        .toISOString()
        .substring(0, 10),
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
          Loading purchase...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* HEADER — same single-card structure as Sales */}
      <PurchaseHeader
        isEditMode={isEditMode}
        status={status}
        isCancelled={isCancelled}
        supplierId={supplierId}
        warehouseId={warehouseId}
        billDate={billDate}
        invoiceNo={invoiceNo}
        taxMode={taxMode}
        onSupplierChange={
          setSupplierId
        }
        onWarehouseChange={
          setWarehouseId
        }
        onBillDateChange={
          setBillDate
        }
        onInvoiceNoChange={
          setInvoiceNo
        }
        onTaxModeChange={
          setTaxMode
        }
        onHeaderComplete={
          focusFirstItemBarcode
        }
      />

      {/* ITEMS */}
      <PurchaseItemsGrid
        rows={transaction.rows}
        taxMode={taxMode}
        addRow={transaction.addRow}
        removeRow={
          transaction.removeRow
        }
        updateField={
          transaction.updateField
        }
        updateRow={
          transaction.updateRow
        }
      />

      {/* TOTALS — Sales-style right-aligned billing summary */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div />
        <div className="w-full rounded-lg border bg-white p-5 shadow-sm">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Gross Amount</span>
              <span>
                ₹
                {getNumber(
                  totals.grossAmount,
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Item Discount</span>
              <span>
                ₹
                {getNumber(
                  totals.discountAmount,
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Bill Discount %</span>
              <input
                type="number"
                value={0}
                disabled
                className="w-24 rounded border bg-gray-50 px-2 py-1 text-right"
                aria-label="Bill Discount Percentage"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Bill Discount</span>
              <span>₹0.00</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Taxable Amount</span>
              <span>
                ₹
                {getNumber(
                  totals.taxableAmount,
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>CGST</span>
              <span>
                ₹
                {getNumber(
                  totals.cgstAmount,
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>SGST</span>
              <span>
                ₹
                {getNumber(
                  totals.sgstAmount,
                ).toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Net Amount</span>
                <span>
                  ₹
                  {getNumber(
                    totals.netAmount,
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS — Sales-style bottom action bar */}
      <div className="rounded-lg border bg-white px-5 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {isEditMode
              ? `Purchase ${status.toLowerCase()}`
              : "New purchase"}
          </div>

          <PurchaseActions
            onSave={handleSave}
            onSaveAndNew={
              handleSaveAndNew
            }
            onClear={handleClear}
            onCancel={
              isEditMode &&
              !isCancelled
                ? handleCancel
                : undefined
            }
            isEditMode={isEditMode}
            saving={saving}
            cancelling={cancelling}
          />
        </div>
      </div>

      {saving && (
        <div className="text-sm text-muted-foreground">
          Saving purchase...
        </div>
      )}

      {cancelling && (
        <div className="text-sm text-muted-foreground">
          Cancelling purchase...
        </div>
      )}

      {isCancelled && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          This purchase has been
          cancelled. It can no longer be
          edited or cancelled again.
        </div>
      )}
    </div>
  );
}
