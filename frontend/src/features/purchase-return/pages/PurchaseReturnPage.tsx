"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import PurchaseReturnHeader from "../components/PurchaseReturnHeader";
import PurchaseReturnItemsTable from "../components/PurchaseReturnItemsTable";
import PurchaseReturnActions from "../components/PurchaseReturnActions";

import {
  createPurchaseReturn,
  getPurchaseReturnable,
} from "../services/purchase-return.service";

import {
  PurchaseReturnItem,
  PurchaseReturnPurchase,
} from "../types/purchase-return.types";

import { getPurchaseList } from "@/features/purchase/services/purchase.service";

interface PurchaseOption {
  id: string;
  billNo: string;
  billDate: string;
  supplierName: string;
}

export default function PurchaseReturnPage() {
  const router = useRouter();

  const [purchases, setPurchases] =
    useState<PurchaseOption[]>([]);

  const [selectedPurchaseId, setSelectedPurchaseId] =
    useState("");

  const [purchase, setPurchase] =
    useState<PurchaseReturnPurchase | null>(null);

  const [items, setItems] =
    useState<PurchaseReturnItem[]>([]);

  const [returnDate, setReturnDate] =
    useState(
      new Date()
        .toISOString()
        .substring(0, 10),
    );

  const [loadingPurchases, setLoadingPurchases] =
    useState(true);

  const [loadingPurchase, setLoadingPurchase] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  // =====================================
  // LOAD PURCHASE LIST
  // =====================================

  useEffect(() => {
    async function loadPurchases() {
      try {
        setLoadingPurchases(true);

        const result =
          await getPurchaseList({
            page: 1,
            pageSize: 100,
          });

        setPurchases(
          result.data.map((row) => ({
            id: row.id,
            billNo: row.billNo,
            billDate: row.billDate,
            supplierName: row.supplierName,
          })),
        );
      } catch (error) {
        console.error(
          "Failed to load purchases:",
          error,
        );

        alert(
          "Failed to load purchase bills.",
        );
      } finally {
        setLoadingPurchases(false);
      }
    }

    loadPurchases();
  }, []);

  // =====================================
  // LOAD SELECTED PURCHASE
  // =====================================

  useEffect(() => {
    if (!selectedPurchaseId) {
      setPurchase(null);
      setItems([]);
      return;
    }

    async function loadPurchase() {
      try {
        setLoadingPurchase(true);

        const result =
          await getPurchaseReturnable(
            selectedPurchaseId,
          );

        setPurchase(result);

        setItems(
          result.items.map((item) => ({
            ...item,
            returnQty: 0,
          })),
        );
      } catch (error) {
        console.error(
          "Failed to load purchase:",
          error,
        );

        alert(
          "Failed to load purchase.",
        );

        setPurchase(null);
        setItems([]);
      } finally {
        setLoadingPurchase(false);
      }
    }

    loadPurchase();
  }, [selectedPurchaseId]);

  // =====================================
  // UPDATE RETURN QTY
  // =====================================

  function handleQtyChange(
    index: number,
    value: number,
  ) {
    setItems((previous) =>
      previous.map(
        (item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          const safeValue =
            Math.max(
              0,
              Math.min(
                value || 0,
                item.availableQty,
                item.currentStock,
              ),
            );

          return {
            ...item,
            returnQty: safeValue,
          };
        },
      ),
    );
  }

  // =====================================
  // TOTALS
  // =====================================

  const totals = useMemo(() => {
    let gross = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const item of items) {
      const amount =
        item.returnQty *
        item.purchaseRate;

      const tax =
        amount *
        item.gstPercent /
        100;

      gross += amount;

      cgst += tax / 2;
      sgst += tax / 2;
    }

    return {
      gross,
      cgst,
      sgst,
      igst,
      net:
        gross +
        cgst +
        sgst +
        igst,
    };
  }, [items]);

  // =====================================
  // SAVE
  // =====================================

  async function handleSave() {
    if (!selectedPurchaseId) {
      alert(
        "Please select a purchase bill.",
      );

      return;
    }

    if (!purchase) {
      alert(
        "Purchase bill details are not loaded.",
      );

      return;
    }

    const returnItems =
      items
        .filter(
          (item) =>
            item.returnQty > 0,
        )
        .map((item) => ({
          itemId: item.itemId,
          batchId: item.batchId,
          qty: item.returnQty,
          purchaseRate: item.purchaseRate,
          gstPercent: item.gstPercent,
        }));

    if (returnItems.length === 0) {
      alert(
        "Please enter at least one return quantity.",
      );

      return;
    }

    try {
      setSaving(true);

      const createdReturn =
        await createPurchaseReturn({
          returnDate:
            new Date(
              returnDate,
            ).toISOString(),

          purchaseBillId:
            purchase.id,

          supplierId:
            purchase.supplierId,

          warehouseId:
            purchase.warehouseId,

          items:
            returnItems,
        });

      alert(
        "Purchase return saved successfully.",
      );

      /*
       * IMPORTANT:
       * Open the newly created return.
       * Do not clear the form first.
       */
      router.push(
        `/purchase-return/view/${createdReturn.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Purchase return save error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save purchase return.",
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // CLEAR
  // =====================================

  function handleClear() {
    setSelectedPurchaseId("");

    setPurchase(null);

    setItems([]);

    setReturnDate(
      new Date()
        .toISOString()
        .substring(0, 10),
    );
  }

  return (
    <div className="space-y-6">

      {/* =====================================
          PAGE HEADER
          ===================================== */}

      <div>
        <h1 className="text-2xl font-bold">
          Purchase Return
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Return goods against an existing purchase bill.
        </p>
      </div>

      {/* =====================================
          PURCHASE SELECTOR
          ===================================== */}

      <div className="rounded-lg border bg-background p-4">

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Purchase Bill
            </label>

            <select
              value={selectedPurchaseId}
              onChange={(e) =>
                setSelectedPurchaseId(
                  e.target.value,
                )
              }
              disabled={
                loadingPurchases ||
                saving
              }
              className="h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">
                Select Purchase Bill
              </option>

              {purchases.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.billNo} -{" "}
                    {item.supplierName}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Return Date
            </label>

            <input
              type="date"
              value={returnDate}
              onChange={(e) =>
                setReturnDate(
                  e.target.value,
                )
              }
              disabled={saving}
              className="h-10 w-full rounded-md border bg-background px-3"
            />
          </div>

        </div>

      </div>

      {/* =====================================
          PURCHASE HEADER
          ===================================== */}

      {purchase && (
        <PurchaseReturnHeader
          returnDate={returnDate}
          purchaseBillNo={
            purchase.billNo
          }
          supplierName={
            purchase.supplier.name
          }
          warehouseName={
            purchase.warehouse.name
          }
          invoiceNo={
            purchase.invoiceNo ?? ""
          }
        />
      )}

      {/* =====================================
          LOADING
          ===================================== */}

      {loadingPurchase && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          Loading purchase items...
        </div>
      )}

      {/* =====================================
          ITEMS
          ===================================== */}

      {purchase &&
        !loadingPurchase && (
          <PurchaseReturnItemsTable
            items={items}
            onQtyChange={
              handleQtyChange
            }
          />
        )}

      {/* =====================================
          TOTALS
          ===================================== */}

      {purchase &&
        !loadingPurchase && (
          <div className="grid grid-cols-4 gap-4 rounded-lg border bg-background p-5">

            <div>
              <div className="text-sm text-muted-foreground">
                Gross Amount
              </div>

              <div className="text-lg font-semibold">
                ₹{totals.gross.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                CGST
              </div>

              <div className="font-semibold">
                ₹{totals.cgst.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                SGST
              </div>

              <div className="font-semibold">
                ₹{totals.sgst.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                Net Amount
              </div>

              <div className="text-lg font-bold">
                ₹{totals.net.toFixed(2)}
              </div>
            </div>

          </div>
        )}

      {/* =====================================
          ACTIONS
          ===================================== */}

      <PurchaseReturnActions
        onClear={handleClear}
        onSave={handleSave}
        saving={saving}
      />

    </div>
  );
}
