"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useShortcut } from "@/hooks/useShortcut";
import { useEffectiveShortcuts } from "@/hooks/useEffectiveShortcuts";

import SalesHeader from "../components/SalesHeader";

import SalesItemsGrid, {
  SalesGridRow,
} from "../components/SalesItemsGrid";

import {
  createCustomer,
  createSale,
  deleteHeldSale,
  getBatches,
  getCustomerBillingSummary,
  getCustomerPartyPrices,
  getCustomerLedger,
  getCustomers,
  getHeldSales,
  getItemLookup,
  getSaleById,
  getWarehouses,
  holdSale,
  previewSale,
  saveCustomerPartyPrice,
  updateSale,
} from "../services/sales.service";

import type {
  CustomerPartyPrice,
  SalesPreview,
} from "../services/sales.service";

import {
  CustomerBillingSummary,
  CustomerLookup,
  HeldSale,
  SalesBatchLookup,
  SalesItemLookup,
  WarehouseLookup,
  SalesPaymentDto,
  SalesPaymentMode,
} from "../types/sales.types";

import { calculateSalesTotals } from "@/core/pricing/sales.totals";

function getTodayDateTime() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60 * 1000,
  )
    .toISOString()
    .slice(0, 16);
}

function getNumber(
  value:
    | number
    | string
    | undefined,
) {
  return Number(value || 0);
}

interface PaymentRow {
  id: number;
  paymentMode: SalesPaymentMode;
  amount: number;
  cardSurcharge: number;
  transactionNo: string;
  remarks: string;
}

interface SalesPageProps {
  saleId?: string;
}

export default function SalesPage({
  saleId,
}: SalesPageProps) {
  const router = useRouter();

  const isEditMode =
    Boolean(saleId);

  const [customers, setCustomers] =
    useState<CustomerLookup[]>([]);

  const [warehouses, setWarehouses] =
    useState<WarehouseLookup[]>([]);

  const [items, setItems] =
    useState<SalesItemLookup[]>([]);

  const [batches, setBatches] =
    useState<SalesBatchLookup[]>([]);

  const [partyPrices, setPartyPrices] =
    useState<CustomerPartyPrice[]>([]);

  const [billNo, setBillNo] =
    useState("");

  const [billDate, setBillDate] =
    useState(getTodayDateTime());

  const [customerId, setCustomerId] =
    useState("");

  const [warehouseId, setWarehouseId] =
    useState("");

  const [isCredit, setIsCredit] =
    useState(false);

  const [taxMode, setTaxMode] = useState<
    "EXCLUSIVE" | "INCLUSIVE"
  >("INCLUSIVE");

  const [
    billDiscountPercent,
    setBillDiscountPercent,
  ] = useState(0);

  const [rows, setRows] =
    useState<SalesGridRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPartyPrices() {
      if (!customerId) {
        setPartyPrices([]);
        return;
      }

      try {
        const prices = await getCustomerPartyPrices(customerId);

        if (cancelled) {
          return;
        }

        setPartyPrices(prices);

        setRows((current) =>
          current.map((row) => {
            const price = prices.find(
              (entry) => entry.itemId === row.itemId,
            );

            return price
              ? {
                  ...row,
                  saleRate: getNumber(price.salePrice),
                }
              : row;
          }),
        );
      } catch (err) {
        console.error("Failed to load party prices:", err);
        if (!cancelled) {
          setPartyPrices([]);
        }
      }
    }

    loadPartyPrices();

    return () => {
      cancelled = true;
    };
  }, [customerId]);
  
  /*
 * Original quantities from the saved bill.
 *
 * Used only while editing so the stock already
 * consumed by this bill can be temporarily added
 * back to the available quantity.
 */
const [originalRows, setOriginalRows] =
  useState<SalesGridRow[]>([]);

  const [
    activeRowIndex,
    setActiveRowIndex,
  ] = useState<number | null>(null);

  const [
    customerOutstanding,
    setCustomerOutstanding,
  ] = useState(0);

  const [
    customerLedgerLoading,
    setCustomerLedgerLoading,
  ] = useState(false);

  const [customerSummary, setCustomerSummary] =
    useState<CustomerBillingSummary | null>(
      null,
    );

  const [
    customerSummaryLoading,
    setCustomerSummaryLoading,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * =====================================================
   * HELD BILLS
   * =====================================================
   */

  const [heldSales, setHeldSales] =
    useState<HeldSale[]>([]);

  const [holding, setHolding] =
    useState(false);

  const [recallOpen, setRecallOpen] =
    useState(false);

  const [holdError, setHoldError] =
    useState<string | null>(null);

  /*
   * =====================================================
   * SCHEME PREVIEW
   * =====================================================
   */

  const [schemePreview, setSchemePreview] =
    useState<SalesPreview | null>(null);

  /*
   * =====================================================
   * PAYMENT POPUP
   * =====================================================
   */

  const [
    paymentOpen,
    setPaymentOpen,
  ] = useState(false);

  const [
    paymentMode,
    setPaymentMode,
  ] = useState<SalesPaymentMode>(
    "CASH",
  );

  /*
   * MIXED IS A FRONTEND-ONLY MODE.
   */

  const [
    mixedPayment,
    setMixedPayment,
  ] = useState(false);

  const [
    payments,
    setPayments,
  ] = useState<PaymentRow[]>([]);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState(0);

  const [
    cardSurcharge,
    setCardSurcharge,
  ] = useState(0);

  const [
    transactionNo,
    setTransactionNo,
  ] = useState("");

  const [
    paymentRemarks,
    setPaymentRemarks,
  ] = useState("");

  const [
    paymentError,
    setPaymentError,
  ] = useState<string | null>(
    null,
  );

  /*
   * =====================================================
   * R.OFF / SHORT
   * =====================================================
   */

  const [
    roundOff,
    setRoundOff,
  ] = useState(0);

  const [
    shortAmount,
    setShortAmount,
  ] = useState(0);

  /*
   * Cash actually handed over.
   */

  const [
    cashReceived,
    setCashReceived,
  ] = useState(0);

  const [
    changeToReturn,
    setChangeToReturn,
  ] = useState(0);

  /*
   * =====================================================
   * LOAD DATA
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [
          customerData,
          warehouseData,
          itemData,
          batchData,
        ] = await Promise.all([
          getCustomers(),
          getWarehouses(),
          getItemLookup(),
          getBatches(),
        ]);

        if (cancelled) {
          return;
        }

        setCustomers(customerData);
        setWarehouses(warehouseData);
        setItems(itemData);
        setBatches(batchData);

        /*
         * =================================================
         * EDIT EXISTING SALE
         * =================================================
         */

        if (saleId) {
          const sale =
            await getSaleById(
              saleId,
            );

          if (cancelled) {
            return;
          }

          setBillNo(
            sale.billNo,
          );

          setBillDate(
            new Date(
              sale.billDate,
            )
              .toISOString()
              .slice(0, 16),
          );

          setCustomerId(
            sale.customerId ??
              "",
          );

          setWarehouseId(
            sale.warehouseId,
          );

          setIsCredit(
            Boolean(
              sale.isCredit,
            ),
          );

          const loadedTaxMode =
            sale.taxMode === "INCLUSIVE"
              ? "INCLUSIVE"
              : "EXCLUSIVE";

          setTaxMode(loadedTaxMode);

          setRoundOff(
            getNumber(
              sale.roundOff,
            ),
          );

          setShortAmount(
            getNumber(
              sale.shortAmount,
            ),
          );

          /*
           * Existing sale items.
           *
           * The stored rate is always tax-exclusive (see
           * sales-calculation.service.ts). If this bill was
           * originally entered inclusive, convert it back to the
           * inclusive figure the operator would recognize, so
           * editing round-trips.
           */

          const loadedRows: SalesGridRow[] =
  sale.items.map(
    (item) => {
      const storedRate = getNumber(
        item.saleRate,
      );

      const gstPercent = getNumber(
        item.gstPercent,
      );

      const displayRate =
        loadedTaxMode === "INCLUSIVE" &&
        gstPercent > 0
          ? storedRate *
            (1 + gstPercent / 100)
          : storedRate;

      return {
      itemId:
        item.itemId,

      batchId:
        item.batchId,

      qty:
        getNumber(
          item.qty,
        ),

      saleRate: displayRate,

      discountPercent:
        getNumber(
          item.discountPercent,
        ),

      gstPercent,
      };
    },
  );

/*
 * Keep a snapshot of the quantities that were
 * originally saved on this bill.
 *
 * IMPORTANT:
 * Do not update this when the user edits the rows.
 */
setOriginalRows(
  loadedRows.map(
    (row) => ({
      ...row,
    }),
  ),
);

setRows(
  loadedRows,
);

          /*
           * Existing payments.
           */

          setPayments(
            (
              sale.payments ??
              []
            ).map(
              (
                payment,
                index,
              ) => ({
                id:
                  Date.now() +
                  index,

                paymentMode:
                  payment.paymentMode as SalesPaymentMode,

                amount:
                  getNumber(
                    payment.amount,
                  ),

                cardSurcharge:
                  getNumber(
                    payment.cardSurcharge,
                  ),

                transactionNo:
                  payment.transactionNo ??
                  "",

                remarks:
                  payment.remarks ??
                  "",
              }),
            ),
          );

          /*
           * Recover bill discount percentage.
           *
           * Backend stores the final taxable amount,
           * so reconstruct the taxable amount before
           * bill discount using:
           *
           * taxable before bill discount
           * =
           * taxableAmount + billDiscountAmount
           */

          const finalTaxable =
            getNumber(
              sale.taxableAmount,
            );

          const billDiscountAmount =
            getNumber(
              sale.billDiscountAmount,
            );

          const taxableBeforeBillDiscount =
            finalTaxable +
            billDiscountAmount;

          const existingBillDiscountPercent =
            taxableBeforeBillDiscount >
            0
              ? (
                  billDiscountAmount /
                  taxableBeforeBillDiscount
                ) *
                100
              : 0;

          setBillDiscountPercent(
            Number(
              existingBillDiscountPercent.toFixed(
                2,
              ),
            ),
          );

          setActiveRowIndex(
            sale.items.length >
              0
              ? 0
              : null,
          );

          return;
        }

        /*
         * =================================================
         * NEW SALE
         * =================================================
         */

        if (
          warehouseData.length ===
          1
        ) {
          setWarehouseId(
            warehouseData[0].id,
          );
        }

        setRows([]);
        setPayments([]);
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load sales data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [saleId]);

  /*
   * =====================================================
   * CUSTOMER OUTSTANDING
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadOutstanding() {
      if (!customerId) {
        setCustomerOutstanding(0);
        return;
      }

      try {
        setCustomerLedgerLoading(
          true,
        );

        const entries =
          await getCustomerLedger(
            customerId,
          );

        if (cancelled) {
          return;
        }

        let debit = 0;
        let credit = 0;

        for (const entry of entries) {
          debit += getNumber(
            entry.debitAmount,
          );

          credit += getNumber(
            entry.creditAmount,
          );
        }

        setCustomerOutstanding(
          debit - credit,
        );
      } catch (err) {
        console.error(
          "Failed to load customer ledger:",
          err,
        );

        if (!cancelled) {
          setCustomerOutstanding(0);
        }
      } finally {
        if (!cancelled) {
          setCustomerLedgerLoading(
            false,
          );
        }
      }
    }

    loadOutstanding();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  /*
   * =====================================================
   * PARTY DASHBOARD
   *
   * Total sales, top items, and purchase history for the
   * selected customer.
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadCustomerSummary() {
      if (!customerId) {
        setCustomerSummary(null);
        return;
      }

      try {
        setCustomerSummaryLoading(true);

        const summary =
          await getCustomerBillingSummary(
            customerId,
          );

        if (!cancelled) {
          setCustomerSummary(summary);
        }
      } catch (err) {
        console.error(
          "Failed to load customer billing summary:",
          err,
        );

        if (!cancelled) {
          setCustomerSummary(null);
        }
      } finally {
        if (!cancelled) {
          setCustomerSummaryLoading(
            false,
          );
        }
      }
    }

    loadCustomerSummary();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  /*
   * =====================================================
   * CREATE CUSTOMER
   * =====================================================
   */

  async function handleCreateCustomer(
    data: {
      name: string;
      mobile: string;
      customerGroup: string;
      priceLevel: string;
      gstCategory: string;
      creditLimit: number;
    },
  ) {
    /*
     * customerCode is left out - the backend generates one
     * (CUS00001, CUS00002, ...), same as Masters and every other
     * customer-creation path.
     */
    const created =
      await createCustomer({
        name: data.name,

        customerGroup:
          data.customerGroup,

        priceLevel:
          data.priceLevel,

        gstCategory:
          data.gstCategory,

        mobile:
          data.mobile || undefined,

        creditLimit:
          data.creditLimit,

        isActive: true,
      });

    const lookup: CustomerLookup = {
      id: created.id,

      customerCode:
        created.customerCode,

      name: created.name,

      customerGroup:
        created.customerGroup,

      priceLevel:
        created.priceLevel,

      gstCategory:
        created.gstCategory,

      mobile:
        created.mobile,

      email:
        created.email,

      creditLimit:
        created.creditLimit,

      openingBalance:
        created.openingBalance,

      city:
        created.city,

      state:
        created.state,
    };

    setCustomers(
      (current) => [
        ...current,
        lookup,
      ],
    );

    setCustomerId(
      created.id,
    );

    setCustomerOutstanding(
      getNumber(
        created.openingBalance,
      ),
    );

    setError(null);
  }

  /*
   * =====================================================
   * ROW MANAGEMENT
   * =====================================================
   */

  function addRow() {
    setRows((current) => {
      const next = [
        ...current,
        {
          itemId: "",
          batchId: "",
          qty: 1,
          saleRate: 0,
          discountPercent: 0,
          gstPercent: 0,
        },
      ];

      setActiveRowIndex(
        next.length - 1,
      );

      return next;
    });
  }

  function removeRow(
    index: number,
  ) {
    setRows((current) => {
      const next =
        current.filter(
          (_, i) => i !== index,
        );

      setActiveRowIndex(
        next.length > 0
          ? Math.min(
              index,
              next.length - 1,
            )
          : null,
      );

      return next;
    });
  }

  function changeItem(
    index: number,
    itemId: string,
  ) {
    const item = items.find(
      (entry) =>
        entry.id === itemId,
    );

    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              itemId,
              batchId: "",
              saleRate: item
                ? getPartyPriceOrDefault(
                    itemId,
                    getNumber(item.retailRate),
                  )
                : 0,
              gstPercent:
                getNumber(
                  (
                    item as SalesItemLookup & {
                      gstPercent?:
                        | number
                        | string;
                    }
                  ).gstPercent,
                ),
            }
          : row,
      ),
    );

    setActiveRowIndex(index);
  }

  function changeBatch(
    index: number,
    batchId: string,
  ) {
    const batch = batches.find(
      (entry) =>
        entry.id === batchId,
    );

    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              batchId,
              saleRate: batch
                ? getPartyPriceOrDefault(
                    row.itemId,
                    getNumber(batch.retailRate),
                  )
                : row.saleRate,
            }
          : row,
      ),
    );

    setActiveRowIndex(index);
  }

  function changeQty(
    index: number,
    qty: number,
  ) {
    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              qty,
            }
          : row,
      ),
    );

    setActiveRowIndex(index);
  }

  async function changeRate(
    index: number,
    saleRate: number,
  ) {
    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              saleRate,
            }
          : row,
      ),
    );

    setActiveRowIndex(index);

    const row = rows[index];

    if (!row || !customerId || !row.itemId) {
      return;
    }

    const existingPrice = partyPrices.find(
      (price) => price.itemId === row.itemId,
    );

    if (
      !window.confirm(
        "Save this rate for this customer and item?",
      )
    ) {
      return;
    }

    try {
      const savedPrice = await saveCustomerPartyPrice(
        customerId,
        row.itemId,
        saleRate,
        existingPrice,
      );

      setPartyPrices((current) => [
        ...current.filter(
          (price) => price.itemId !== row.itemId,
        ),
        savedPrice,
      ]);
    } catch (err) {
      console.error("Failed to save party price:", err);
      setError(
        err instanceof Error
          ? "Rate was used for this bill but could not be saved for the customer."
          : "Rate was used for this bill but could not be saved for the customer.",
      );
    }
  }

  function getPartyPriceOrDefault(
    itemId: string,
    fallbackRate: number,
  ) {
    const partyPrice = partyPrices.find(
      (price) => price.itemId === itemId,
    );

    return partyPrice
      ? getNumber(partyPrice.salePrice)
      : fallbackRate;
  }

  /*
   * Continues the natural flow from the header's last field (Sale
   * Type) into the Items search bar, mirroring the same
   * data-attribute-free aria-label targeting used elsewhere on this
   * screen - so the whole screen reads as one sequence: Customer ->
   * Sale Type -> first item scan.
   */
  function focusItemSearchBar() {
    const el = document.querySelector(
      'input[aria-label="Scan barcode or search item"]',
    ) as HTMLInputElement | null;

    if (el) {
      el.focus();
      el.select();
    }
  }

  /*
   * =====================================================
   * FAST ITEM ADD
   * =====================================================
   */

  function quickAddItem(
    itemId: string,
  ) {
    const item = items.find(
      (entry) =>
        entry.id === itemId,
    );

    if (!item) {
      setError(
        "Item could not be found.",
      );
      return;
    }

    const eligibleBatches =
      batches.filter(
        (batch) =>
          batch.itemId === itemId &&
          batch.isActive !== false &&
          batch.status !==
            "INACTIVE",
      );

    const automaticBatch =
      eligibleBatches.length === 1
        ? eligibleBatches[0]
        : undefined;

    const batchId =
      automaticBatch?.id ?? "";

    const saleRate =
      automaticBatch
        ? getNumber(
            automaticBatch.retailRate,
          )
        : getNumber(
            item.retailRate,
          );

    const existingIndex =
      rows.findIndex(
        (row) =>
          row.itemId === itemId &&
          row.batchId === batchId &&
          getNumber(
            row.saleRate,
          ) === saleRate,
      );

    if (existingIndex >= 0) {
      setRows((current) =>
        current.map(
          (row, index) =>
            index ===
            existingIndex
              ? {
                  ...row,
                  qty:
                    getNumber(
                      row.qty,
                    ) + 1,
                }
              : row,
        ),
      );

      setActiveRowIndex(
        existingIndex,
      );

      return;
    }

    const newRow: SalesGridRow = {
      itemId,

      batchId,

      qty: 1,

      saleRate: getPartyPriceOrDefault(
        itemId,
        saleRate,
      ),

      discountPercent: 0,

      gstPercent:
        getNumber(
          (
            item as SalesItemLookup & {
              gstPercent?:
                | number
                | string;
            }
          ).gstPercent,
        ),
    };

    setRows((current) => [
      ...current,
      newRow,
    ]);

    setActiveRowIndex(
      rows.length,
    );
  }

  /*
   * =====================================================
   * QUICK SET QUANTITY
   * =====================================================
   */

  function quickSetQty(
    qty: number,
  ) {
    if (
      activeRowIndex === null
    ) {
      setError(
        "Add an item before entering a quantity.",
      );
      return;
    }

    if (
      !Number.isFinite(qty) ||
      qty <= 0
    ) {
      setError(
        "Quantity must be greater than zero.",
      );
      return;
    }

    setRows((current) =>
      current.map(
        (row, index) =>
          index ===
          activeRowIndex
            ? {
                ...row,
                qty,
              }
            : row,
      ),
    );

    setError(null);
  }

  /*
   * =====================================================
   * TOTALS
   * =====================================================
   */

  const totals = useMemo(
    () =>
      calculateSalesTotals(
        rows,
        billDiscountPercent,
        taxMode,
      ),
    [
      rows,
      billDiscountPercent,
      taxMode,
    ],
  );

  /*
   * =====================================================
   * AUTOMATIC R.OFF
   * =====================================================
   */

  const automaticRoundOff =
    useMemo(() => {
      const rounded =
        Math.round(
          totals.net,
        );

      return Number(
        (
          rounded -
          totals.net
        ).toFixed(2),
      );
    }, [totals.net]);

  /*
   * =====================================================
   * FINAL PAYABLE
   * =====================================================
   */

  const finalPayable =
    useMemo(() => {
      return Number(
        Math.max(
          totals.net +
            roundOff -
            shortAmount,
          0,
        ).toFixed(2),
      );
    }, [
      totals.net,
      roundOff,
      shortAmount,
    ]);

  /*
   * =====================================================
   * PAID AMOUNT
   * =====================================================
   */

  const paidAmount = useMemo(
    () =>
      payments.reduce(
        (
          sum,
          payment,
        ) =>
          sum +
          getNumber(
            payment.amount,
          ) +
          getNumber(
            payment.cardSurcharge,
          ),
        0,
      ),
    [payments],
  );

  /*
   * =====================================================
   * PAYMENT BALANCE
   * =====================================================
   */

  const paymentBalance =
    Math.max(
      finalPayable -
        paidAmount,
      0,
    );

  /*
   * =====================================================
   * PAYMENT EXCESS
   * =====================================================
   */

  const paymentExcess =
    Math.max(
      paidAmount -
        finalPayable,
      0,
    );

  /*
   * =====================================================
   * CASH PAYMENT
   * =====================================================
   */

  const cashPaymentAmount =
    payments
      .filter(
        (payment) =>
          payment.paymentMode ===
          "CASH",
      )
      .reduce(
        (
          sum,
          payment,
        ) =>
          sum +
          getNumber(
            payment.amount,
          ),
        0,
      );

  const cashChange =
    changeToReturn > 0
      ? changeToReturn
      : Math.max(
          cashReceived -
            Math.min(
              Math.max(
                cashReceived,
                0,
              ),
              paymentBalance,
            ),
          0,
        );

  /*
   * =====================================================
   * OPEN PAYMENT POPUP
   * =====================================================
   */

  function openPaymentPopup() {
    setPaymentError(null);

    if (!warehouseId) {
      setError(
        "Please select a warehouse.",
      );
      return;
    }

    if (
      isCredit &&
      !customerId
    ) {
      setError(
        "Customer is required for credit sales.",
      );
      return;
    }

    if (rows.length === 0) {
      setError(
        "Please add at least one item.",
      );
      return;
    }

    const invalidRow =
      rows.find(
        (row) =>
          !row.itemId ||
          !row.batchId ||
          row.qty <= 0,
      );

    if (invalidRow) {
      setError(
        "Please complete item, batch and quantity for every row.",
      );
      return;
    }

    /*
     * NEW SALE:
     * automatically apply nearest-rupee R.OFF.
     *
     * EDIT:
     * preserve existing R.OFF / SHORT values.
     */

    if (!isEditMode) {
      const automatic =
        Number(
          (
            Math.round(
              totals.net,
            ) -
            totals.net
          ).toFixed(2),
        );

      setRoundOff(
        automatic,
      );

      setShortAmount(0);

      setPayments([]);

      setMixedPayment(false);

      if (isCredit) {
        setPaymentMode(
          "CREDIT",
        );

        setPaymentAmount(0);
      } else {
        setPaymentMode(
          "CASH",
        );

        setPaymentAmount(
          Math.round(
            totals.net +
              automatic,
          ),
        );
      }

      setCardSurcharge(0);

      setCashReceived(
        Math.round(
          totals.net +
            automatic,
        ),
      );

      setChangeToReturn(0);

      setTransactionNo("");

      setPaymentRemarks("");
    } else {
      /*
       * EDIT MODE
       *
       * Keep existing payments.
       * Determine the current payment mode from
       * the existing payment rows.
       */

      if (isCredit) {
        setPaymentMode(
          "CREDIT",
        );

        setMixedPayment(false);

        setPaymentAmount(0);
      } else if (
        payments.length === 1
      ) {
        setPaymentMode(
          payments[0]
            .paymentMode,
        );

        setMixedPayment(false);

        setPaymentAmount(
          Math.max(
            finalPayable -
              paidAmount,
            0,
          ),
        );
      } else if (
        payments.length > 1
      ) {
        setPaymentMode(
          "CASH",
        );

        setMixedPayment(true);

        setPaymentAmount(
          Math.max(
            finalPayable -
              paidAmount,
            0,
          ),
        );
      } else {
        setPaymentMode(
          "CASH",
        );

        setMixedPayment(false);

        setPaymentAmount(
          finalPayable,
        );

        setCashReceived(
          finalPayable,
        );
      }
    }

    setPaymentOpen(true);

    setError(null);
  }

  /*
   * =====================================================
   * SET PAYMENT MODE
   * =====================================================
   */

  function selectPaymentMode(
    mode:
      | SalesPaymentMode
      | "MIXED",
  ) {
    setPaymentError(null);

    if (mode === "MIXED") {
      setMixedPayment(true);

      setChangeToReturn(0);

      setPaymentMode(
        "CASH",
      );

      const remaining =
        Math.max(
          finalPayable -
            paidAmount,
          0,
        );

      setPaymentAmount(
        Number(
          remaining.toFixed(
            2,
          ),
        ),
      );

      setCardSurcharge(0);

      return;
    }

    setMixedPayment(false);

    setChangeToReturn(0);

    setPaymentMode(mode);

    const remaining =
      Math.max(
        finalPayable -
          paidAmount,
        0,
      );

    if (
      mode === "CREDIT"
    ) {
      setPaymentAmount(0);
      setCardSurcharge(0);
      return;
    }

    setPaymentAmount(
      Number(
        remaining.toFixed(2),
      ),
    );

    if (mode !== "CARD") {
      setCardSurcharge(0);
    }
  }

  /*
   * =====================================================
   * ADD PAYMENT
   * =====================================================
   */

  function addPayment() {
    setPaymentError(null);

    if (
      paymentMode ===
      "CREDIT"
    ) {
      setPaymentError(
        "Credit is not added as a payment row. Use CREDIT mode for a credit sale.",
      );
      return;
    }

    const remaining =
      Math.max(
        Number(
          (
            finalPayable -
            paidAmount
          ).toFixed(2),
        ),
        0,
      );

    if (remaining <= 0.01) {
      setPaymentError(
        "The bill is already fully paid.",
      );
      return;
    }

    let amount =
      Number(
        paymentAmount,
      );

    let received = 0;

    if (
      paymentMode ===
      "CASH"
    ) {
      received =
        Number(
          cashReceived,
        );

      if (
        !Number.isFinite(
          received,
        ) ||
        received <= 0
      ) {
        setPaymentError(
          "Enter the cash received from the customer.",
        );
        return;
      }

      amount = Math.min(
        received,
        remaining,
      );
    }

    const surcharge =
      paymentMode ===
      "CARD"
        ? Number(
            cardSurcharge,
          )
        : 0;

    if (
      !Number.isFinite(
        amount,
      ) ||
      amount <= 0
    ) {
      setPaymentError(
        "Enter a valid payment amount.",
      );
      return;
    }

    if (
      !Number.isFinite(
        surcharge,
      ) ||
      surcharge < 0
    ) {
      setPaymentError(
        "Enter a valid card surcharge.",
      );
      return;
    }

    const totalThisPayment =
      Number(
        (
          amount +
          surcharge
        ).toFixed(2),
      );

    if (
      totalThisPayment >
      remaining + 0.01
    ) {
      setPaymentError(
        `Payment exceeds the remaining balance of ₹${remaining.toFixed(
          2,
        )}.`,
      );
      return;
    }

    if (
      paymentMode ===
      "CASH"
    ) {
      const change =
        Math.max(
          Number(
            (
              received -
              amount
            ).toFixed(2),
          ),
          0,
        );

      setChangeToReturn(
        change,
      );
    } else {
      setChangeToReturn(0);
    }

    const newPayment: PaymentRow =
      {
        id: Date.now(),

        paymentMode,

        amount:
          Number(
            amount.toFixed(2),
          ),

        cardSurcharge:
          Number(
            surcharge.toFixed(2),
          ),

        transactionNo:
          transactionNo.trim(),

        remarks:
          paymentRemarks.trim(),
      };

    setPayments(
      (current) => [
        ...current,
        newPayment,
      ],
    );

    const nextRemaining =
      Math.max(
        Number(
          (
            remaining -
            totalThisPayment
          ).toFixed(2),
        ),
        0,
      );

    setPaymentAmount(
      Number(
        nextRemaining.toFixed(
          2,
        ),
      ),
    );

    setCardSurcharge(0);

    setTransactionNo("");

    setPaymentRemarks("");

    if (
      paymentMode ===
      "CASH"
    ) {
      setCashReceived(0);
    }
  }

  /*
   * =====================================================
   * REMOVE PAYMENT
   * =====================================================
   */

  function removePayment(
    id: number,
  ) {
    setPayments(
      (current) =>
        current.filter(
          (payment) =>
            payment.id !== id,
        ),
    );

    setPaymentError(null);

    setChangeToReturn(0);
  }

  /*
   * =====================================================
   * FINAL SAVE / UPDATE
   * =====================================================
   */

  async function saveSale(
    finalPayments?: PaymentRow[],
  ) {
    try {
      setPaymentError(null);

      setError(null);

      if (
        rows.length === 0
      ) {
        setPaymentError(
          "Please add at least one item.",
        );

        return;
      }

      const paymentsToSave =
        finalPayments ??
        payments;

      /*
       * =================================================
       * CREDIT SALE
       * =================================================
       */

      if (isCredit) {
        if (!customerId) {
          setPaymentError(
            "Customer is required for credit sales.",
          );

          return;
        }
      } else {
        const totalPaid =
          paymentsToSave.reduce(
            (
              sum,
              payment,
            ) =>
              sum +
              getNumber(
                payment.amount,
              ) +
              getNumber(
                payment.cardSurcharge,
              ),
            0,
          );

        if (
          Math.abs(
            totalPaid -
              finalPayable,
          ) > 0.01
        ) {
          setPaymentError(
            `Payment is incomplete. Balance: ₹${Math.max(
              finalPayable -
                totalPaid,
              0,
            ).toFixed(2)}`,
          );

          return;
        }

        /*
         * Cash received validation.
         */

        if (
          cashReceived > 0 &&
          cashPaymentAmount >
            0 &&
          cashReceived <
            cashPaymentAmount -
              0.01
        ) {
          setPaymentError(
            `Cash received is less than the CASH payment amount by ₹${(
              cashPaymentAmount -
              cashReceived
            ).toFixed(2)}. Use R.OFF / SHORT if the customer is paying less.`,
          );

          return;
        }
      }

      /*
       * Validate rows before sending.
       */

      const invalidRow =
        rows.find(
          (row) =>
            !row.itemId ||
            !row.batchId ||
            !Number.isFinite(
              Number(
                row.qty,
              ),
            ) ||
            Number(
              row.qty,
            ) <= 0,
        );

      if (invalidRow) {
        setPaymentError(
          "Please complete item, batch and quantity for every row.",
        );

        return;
      }

      setSaving(true);

      const paymentDto:
        SalesPaymentDto[] =
        paymentsToSave.map(
          (payment) => ({
            paymentMode:
              payment.paymentMode,

            amount:
              payment.amount,

            cardSurcharge:
              payment.cardSurcharge,

            transactionNo:
              payment.transactionNo ||
              undefined,

            remarks:
              payment.remarks ||
              undefined,
          }),
        );

      const saleDto = {
        billNo:
          isEditMode
            ? billNo
            : undefined,

        billDate:
          new Date(
            billDate,
          ).toISOString(),

        customerId:
          customerId ||
          undefined,

        warehouseId,

        isCredit,

        taxMode,

        billDiscountPercent,

        roundOff,

        shortAmount,

        payments:
          isCredit
            ? []
            : paymentDto,

        items: rows.map(
          (row) => ({
            itemId:
              row.itemId,

            batchId:
              row.batchId,

            qty:
              row.qty,

            saleRate:
              Number(
                row.saleRate,
              ),

            discountPercent:
              row.discountPercent,

            gstPercent:
              row.gstPercent,
          }),
        ),
      };

      /*
       * =================================================
       * CREATE vs UPDATE
       * =================================================
       */

      const result =
        saleId
          ? await updateSale(
              saleId,
              saleDto,
            )
          : await createSale(
              saleDto,
            );

      setPaymentOpen(false);

      router.push(
        `/sales/view/${result.id}`,
      );
    } catch (err) {
      console.error(err);

      setPaymentError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Failed to update sale."
            : "Failed to save sale.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * HELD BILLS
   * =====================================================
   */

  async function refreshHeldSales() {
    try {
      const held = await getHeldSales();

      setHeldSales(held);
    } catch (err) {
      console.error(
        "Failed to load held bills:",
        err,
      );
    }
  }

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    refreshHeldSales();
  }, [isEditMode]);

  /*
   * =====================================================
   * SCHEME PREVIEW
   *
   * Debounced call to the server-side pricing/scheme
   * engine so the cashier sees scheme-granted free items
   * and the real total before checkout. Purely informational
   * - the actual save always recomputes schemes itself.
   * =====================================================
   */

  useEffect(() => {
    const completeRows = rows.filter(
      (row) =>
        row.itemId &&
        row.batchId &&
        Number(row.qty) > 0,
    );

    if (!warehouseId || completeRows.length === 0) {
      setSchemePreview(null);

      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const preview = await previewSale({
          billDate: new Date(
            billDate,
          ).toISOString(),

          customerId: customerId || undefined,

          warehouseId,

          isCredit,

          taxMode,

          billDiscountPercent,

          roundOff,

          shortAmount,

          items: completeRows.map((row) => ({
            itemId: row.itemId,
            batchId: row.batchId,
            qty: row.qty,
            saleRate: Number(row.saleRate),
            discountPercent: row.discountPercent,
            gstPercent: row.gstPercent,
          })),
        });

        if (!cancelled) {
          setSchemePreview(preview);
        }
      } catch (err) {
        if (!cancelled) {
          setSchemePreview(null);
        }

        console.error(
          "Scheme preview failed:",
          err,
        );
      }
    }, 400);

    return () => {
      cancelled = true;

      clearTimeout(timer);
    };
  }, [
    rows,
    warehouseId,
    customerId,
    billDate,
    isCredit,
    taxMode,
    billDiscountPercent,
    roundOff,
    shortAmount,
  ]);

  const schemeFreeLines = (
    schemePreview?.items ?? []
  ).filter((line) => {
    const enteredRow = rows.find(
      (row) =>
        row.itemId === line.itemId &&
        row.batchId === line.batchId,
    );

    const enteredQty = enteredRow
      ? Number(enteredRow.qty)
      : 0;

    return line.freeQty > 0 &&
      line.qty > enteredQty;
  });

  function resetBillForm() {
    setCustomerId("");

    setIsCredit(false);

    setTaxMode("INCLUSIVE");

    setBillDiscountPercent(0);

    setRoundOff(0);

    setShortAmount(0);

    setRows([]);

    setOriginalRows([]);

    setActiveRowIndex(null);

    setBillDate(
      getTodayDateTime(),
    );

    if (warehouses.length === 1) {
      setWarehouseId(
        warehouses[0].id,
      );
    }
  }

  async function handleHoldBill() {
    setHoldError(null);

    if (!warehouseId) {
      setHoldError(
        "Select a warehouse before holding the bill.",
      );

      return;
    }

    const completeRows = rows.filter(
      (row) =>
        row.itemId &&
        row.batchId &&
        Number(row.qty) > 0,
    );

    if (completeRows.length === 0) {
      setHoldError(
        "Add at least one item before holding the bill.",
      );

      return;
    }

    const customerName =
      customers.find(
        (customer) =>
          customer.id === customerId,
      )?.name ?? "Walk-in";

    const holdName =
      `${customerName} - ${new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      )}`;

    setHolding(true);

    try {
      await holdSale({
        holdName,

        billDate: new Date(
          billDate,
        ).toISOString(),

        customerId:
          customerId || undefined,

        warehouseId,

        isCredit,

        taxMode,

        billDiscountPercent,

        roundOff,

        shortAmount,

        items: completeRows.map(
          (row) => ({
            itemId: row.itemId,
            batchId: row.batchId,
            qty: row.qty,
            saleRate: Number(
              row.saleRate,
            ),
            discountPercent:
              row.discountPercent,
            gstPercent:
              row.gstPercent,
          }),
        ),
      });

      resetBillForm();

      await refreshHeldSales();
    } catch (err) {
      console.error(err);

      setHoldError(
        err instanceof Error
          ? err.message
          : "Failed to hold the bill.",
      );
    } finally {
      setHolding(false);
    }
  }

  function recallHeldSale(
    held: HeldSale,
  ) {
    const payload = held.payload;

    setCustomerId(
      payload.customerId ?? "",
    );

    setWarehouseId(
      payload.warehouseId,
    );

    setIsCredit(
      Boolean(payload.isCredit),
    );

    setTaxMode(
      payload.taxMode === "INCLUSIVE"
        ? "INCLUSIVE"
        : "EXCLUSIVE",
    );

    setBillDiscountPercent(
      getNumber(
        payload.billDiscountPercent,
      ),
    );

    setRoundOff(
      getNumber(payload.roundOff),
    );

    setShortAmount(
      getNumber(
        payload.shortAmount,
      ),
    );

    const loadedRows: SalesGridRow[] =
      payload.items.map((item) => ({
        itemId: item.itemId,
        batchId: item.batchId,
        qty: getNumber(item.qty),
        saleRate: getNumber(
          item.saleRate,
        ),
        discountPercent: getNumber(
          item.discountPercent,
        ),
        gstPercent: getNumber(
          item.gstPercent,
        ),
      }));

    setRows(loadedRows);
    setOriginalRows([]);

    setActiveRowIndex(
      loadedRows.length > 0
        ? 0
        : null,
    );

    setRecallOpen(false);
    setHoldError(null);

    deleteHeldSale(held.id)
      .then(refreshHeldSales)
      .catch((err) =>
        console.error(
          "Failed to remove held bill after recall:",
          err,
        ),
      );
  }

  async function discardHeldSale(
    id: string,
  ) {
    try {
      await deleteHeldSale(id);

      await refreshHeldSales();
    } catch (err) {
      console.error(
        "Failed to discard held bill:",
        err,
      );
    }
  }

  /*
   * =====================================================
   * HOLD / RECALL KEYBOARD
   *
   * Driven by the shortcut registry (HOLD_BILL /
   * RECALL_BILL) rather than a hardcoded key check, so an
   * admin can rebind or disable either one from
   * /admin/shortcuts.
   * =====================================================
   */

  useShortcut(
    "HOLD_BILL",
    () => handleHoldBill(),
    { enabled: !isEditMode && !paymentOpen },
  );

  useShortcut(
    "RECALL_BILL",
    () => setRecallOpen((current) => !current),
    { enabled: !isEditMode && !paymentOpen },
  );

  const { data: effectiveShortcuts } =
    useEffectiveShortcuts();

  function shortcutKeyLabel(
    actionCode: string,
    fallback: string,
  ) {
    const shortcut = effectiveShortcuts?.find(
      (s) => s.actionCode === actionCode,
    );

    if (!shortcut || !shortcut.enabled) {
      return null;
    }

    return shortcut.key || fallback;
  }

  /*
   * =====================================================
   * PAYMENT KEYBOARD
   * =====================================================
   */

  useEffect(() => {
    if (!paymentOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        event.preventDefault();

        setPaymentOpen(false);

        return;
      }

      if (event.key === "F1") {
        event.preventDefault();

        selectPaymentMode(
          "CASH",
        );

        return;
      }

      if (event.key === "F2") {
        event.preventDefault();

        selectPaymentMode(
          "UPI",
        );

        return;
      }

      if (event.key === "F3") {
        event.preventDefault();

        selectPaymentMode(
          "CARD",
        );

        return;
      }

      if (event.key === "F4") {
        event.preventDefault();

        selectPaymentMode(
          "CREDIT",
        );

        return;
      }

      if (event.key === "F5") {
        event.preventDefault();

        selectPaymentMode(
          "MIXED",
        );

        return;
      }

      if (
        event.key ===
          "Enter" &&
        !saving
      ) {
        const target =
          event.target as HTMLElement;

        if (
          target.tagName ===
            "INPUT" &&
          (
            target as HTMLInputElement
          ).type !==
            "button"
        ) {
          return;
        }

        event.preventDefault();

        if (
          paymentMode ===
          "CREDIT"
        ) {
          saveSale([]);
        } else {
          addPayment();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    paymentOpen,
    paymentMode,
    paymentAmount,
    cardSurcharge,
    transactionNo,
    paymentRemarks,
    payments,
    totals.net,
    finalPayable,
    shortAmount,
    changeToReturn,
    saving,
    isCredit,
    cashReceived,
    cashPaymentAmount,
  ]);

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        {isEditMode
          ? "Loading sale..."
          : "Loading sales screen..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isEditMode && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
          Editing Sale: {billNo}
        </div>
      )}

      {!isEditMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={holding}
              onClick={handleHoldBill}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {holding
                ? "Holding..."
                : `Hold Bill${
                    shortcutKeyLabel(
                      "HOLD_BILL",
                      "F6",
                    )
                      ? ` (${shortcutKeyLabel(
                          "HOLD_BILL",
                          "F6",
                        )})`
                      : ""
                  }`}
            </button>

            <button
              type="button"
              onClick={() =>
                setRecallOpen(true)
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Recall
              {shortcutKeyLabel(
                "RECALL_BILL",
                "F7",
              )
                ? ` (${shortcutKeyLabel(
                    "RECALL_BILL",
                    "F7",
                  )})`
                : ""}
              {heldSales.length > 0
                ? ` (${heldSales.length})`
                : ""}
            </button>
          </div>

          {holdError && (
            <div className="text-sm text-red-600">
              {holdError}
            </div>
          )}
        </div>
      )}

      <SalesHeader
        billNo={billNo}
        billDate={billDate}
        customerId={customerId}
        warehouseId={warehouseId}
        customers={customers}
        warehouses={warehouses}
        isCredit={isCredit}
        isEditMode={isEditMode}
        customerOutstanding={
          customerOutstanding
        }
        customerLedgerLoading={
          customerLedgerLoading
        }
        customerSummary={
          customerSummary
        }
        customerSummaryLoading={
          customerSummaryLoading
        }
        onBillNoChange={
          setBillNo
        }
        onBillDateChange={
          setBillDate
        }
        onCustomerChange={
          setCustomerId
        }
        onWarehouseChange={
          setWarehouseId
        }
        onCreditChange={
          setIsCredit
        }
        onSaleTypeComplete={
          focusItemSearchBar
        }
        onCreateCustomer={
          handleCreateCustomer
        }
      />

      <SalesItemsGrid
      rows={rows}
      originalRows={originalRows}
      items={items}
      batches={batches}
      warehouseId={warehouseId}
      taxMode={taxMode}
        onAddRow={addRow}
        onRemoveRow={
          removeRow
        }
        onItemChange={
          changeItem
        }
        onBatchChange={
          changeBatch
        }
        onQtyChange={
          changeQty
        }
        onRateChange={
          changeRate
        }
        onQuickAddItem={
          quickAddItem
        }
        onQuickSetQty={
          quickSetQty
        }
      />

      {/* =====================================================
          SCHEME PREVIEW
          ===================================================== */}

      {schemeFreeLines.length > 0 && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <span className="font-semibold">
            Scheme applied:
          </span>{" "}
          {schemeFreeLines
            .map((line) => {
              const itemName =
                items.find(
                  (entry) =>
                    entry.id === line.itemId,
                )?.name ?? line.itemId;

              return `+${line.freeQty} ${itemName} free`;
            })
            .join(", ")}
        </div>
      )}

      {/* =====================================================
          TOTALS
          ===================================================== */}

      <div className="flex justify-end">
        <div className="w-full max-w-md rounded-lg border bg-white p-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>
                Gross Amount
              </span>

              <span>
                ₹
                {totals.gross.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Item Discount
              </span>

              <span>
                ₹
                {totals.itemDiscount.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>
                Bill Discount %
              </span>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={
                  billDiscountPercent
                }
                onChange={(
                  event,
                ) =>
                  setBillDiscountPercent(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="w-24 rounded border px-2 py-1 text-right"
              />
            </div>

            <div className="flex justify-between">
              <span>
                Bill Discount
              </span>

              <span>
                ₹
                {totals.billDiscount.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Taxable Amount
              </span>

              <span>
                ₹
                {totals.taxable.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                CGST
              </span>

              <span>
                ₹
                {totals.cgst.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                SGST
              </span>

              <span>
                ₹
                {totals.sgst.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>
                  Net Amount
                </span>

                <span>
                  ₹
                  {totals.net.toFixed(
                    2,
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={
                openPaymentPopup
              }
              className="mt-3 w-full rounded-md bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                  ? "Proceed to Update"
                  : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          PAYMENT POPUP
          ===================================================== */}

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">
                  {isEditMode
                    ? "Update Payment"
                    : "Payment"}
                </h2>

                <p className="text-sm text-gray-500">
                  Bill {billNo}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentOpen(
                    false,
                  )
                }
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="space-y-5">

                {paymentError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                )}

                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-4">

                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Net Amount
                      </div>

                      <div className="mt-1 text-xl font-bold">
                        ₹
                        {totals.net.toFixed(
                          2,
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Round Off
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        value={
                          roundOff
                        }
                        onChange={(
                          event,
                        ) =>
                          setRoundOff(
                            Number(
                              event
                                .target
                                .value ||
                                0,
                            ),
                          )
                        }
                        className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-right font-semibold"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setRoundOff(
                            automaticRoundOff,
                          )
                        }
                        className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        Auto:{" "}
                        {automaticRoundOff >=
                        0
                          ? "+"
                          : ""}
                        ₹
                        {automaticRoundOff.toFixed(
                          2,
                        )}
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Short Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          shortAmount
                        }
                        onChange={(
                          event,
                        ) =>
                          setShortAmount(
                            Math.max(
                              Number(
                                event
                                  .target
                                  .value ||
                                  0,
                              ),
                              0,
                            ),
                          )
                        }
                        className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-right font-semibold"
                      />

                      <div className="mt-1 text-xs text-gray-500">
                        Customer pays less than payable.
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Amount Payable
                      </div>

                      <div className="mt-1 text-2xl font-black">
                        ₹
                        {finalPayable.toFixed(
                          2,
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold">
                    Payment Method
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">

                    {([
                      "CASH",
                      "UPI",
                      "CARD",
                      "MIXED",
                      "CREDIT",
                    ] as const).map(
                      (mode) => {
                        const active =
                          mode ===
                          "MIXED"
                            ? mixedPayment
                            : !mixedPayment &&
                              paymentMode ===
                                mode;

                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              selectPaymentMode(
                                mode,
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                              active
                                ? "border-black bg-black text-white"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            {mode}
                          </button>
                        );
                      },
                    )}

                  </div>
                </div>

                {paymentMode ===
                  "CREDIT" &&
                !mixedPayment ? (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                    <div className="font-semibold text-yellow-900">
                      Credit Sale
                    </div>

                    <p className="mt-1 text-sm text-yellow-800">
                      No immediate payment will be collected. ₹
                      {finalPayable.toFixed(
                        2,
                      )}{" "}
                      will be posted to the customer's outstanding balance.
                    </p>

                    {!customerId && (
                      <p className="mt-2 text-sm font-semibold text-red-600">
                        A customer is required for credit sales.
                      </p>
                    )}

                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border p-4">

                      <div className="mb-4 flex items-center justify-between">

                        <div>
                          <div className="font-semibold">
                            {paymentMode ===
                            "CASH"
                              ? "Cash Payment"
                              : mixedPayment
                                ? `Add ${paymentMode} Payment`
                                : `${paymentMode} Payment`}
                          </div>

                          <div className="text-xs text-gray-500">
                            {paymentMode ===
                            "CASH"
                              ? "Enter the physical cash received from the customer."
                              : "Enter the amount applied to this bill."}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            Balance
                          </div>

                          <div className="font-bold">
                            ₹
                            {paymentBalance.toFixed(
                              2,
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="grid gap-4 md:grid-cols-2">

                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            {paymentMode ===
                            "CASH"
                              ? "Cash Received"
                              : "Amount"}
                          </label>

                          <input
                            autoFocus
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              paymentMode ===
                              "CASH"
                                ? cashReceived
                                : paymentAmount
                            }
                            onChange={(
                              event,
                            ) => {
                              const value =
                                Number(
                                  event
                                    .target
                                    .value ||
                                    0,
                                );

                              if (
                                paymentMode ===
                                "CASH"
                              ) {
                                setCashReceived(
                                  value,
                                );

                                setChangeToReturn(
                                  Math.max(
                                    value -
                                      paymentBalance,
                                    0,
                                  ),
                                );

                                setPaymentAmount(
                                  Math.min(
                                    Math.max(
                                      value,
                                      0,
                                    ),
                                    paymentBalance,
                                  ),
                                );
                              } else {
                                setPaymentAmount(
                                  value,
                                );
                              }
                            }}
                            className="w-full rounded-xl border-2 px-4 py-3 text-xl font-bold text-right"
                          />
                        </div>

                        {paymentMode ===
                        "CARD" ? (
                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              Card Surcharge
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                cardSurcharge
                              }
                              onChange={(
                                event,
                              ) =>
                                setCardSurcharge(
                                  Number(
                                    event
                                      .target
                                      .value ||
                                      0,
                                  ),
                                )
                              }
                              className="w-full rounded-xl border px-4 py-3 text-right font-semibold"
                            />
                          </div>
                        ) : paymentMode ===
                          "CASH" ? (
                          <div className="grid grid-cols-2 gap-3">

                            <div className="rounded-xl bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">
                                Amount Applied
                              </div>

                              <div className="mt-1 text-lg font-bold">
                                ₹
                                {Math.min(
                                  Math.max(
                                    cashReceived,
                                    0,
                                  ),
                                  paymentBalance,
                                ).toFixed(
                                  2,
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl bg-green-50 p-3">
                              <div className="text-xs text-gray-500">
                                Change / Return
                              </div>

                              <div className="mt-1 text-lg font-bold text-green-700">
                                ₹
                                {cashChange.toFixed(
                                  2,
                                )}
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              Transaction No.
                            </label>

                            <input
                              type="text"
                              value={
                                transactionNo
                              }
                              onChange={(
                                event,
                              ) =>
                                setTransactionNo(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder={
                                paymentMode ===
                                "UPI"
                                  ? "UPI transaction / UTR"
                                  : "Optional"
                              }
                              className="w-full rounded-xl border px-4 py-3"
                            />
                          </div>
                        )}

                      </div>

                      {paymentMode !==
                        "CASH" && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">

                          {paymentMode ===
                            "CARD" && (
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Transaction No.
                              </label>

                              <input
                                type="text"
                                value={
                                  transactionNo
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setTransactionNo(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="Optional"
                                className="w-full rounded-xl border px-4 py-3"
                              />
                            </div>
                          )}

                          <div
                            className={
                              paymentMode ===
                              "CARD"
                                ? ""
                                : "md:col-span-2"
                            }
                          >
                            <label className="mb-1 block text-sm font-medium">
                              Remarks
                            </label>

                            <input
                              type="text"
                              value={
                                paymentRemarks
                              }
                              onChange={(
                                event,
                              ) =>
                                setPaymentRemarks(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder="Optional"
                              className="w-full rounded-xl border px-4 py-3"
                            />
                          </div>

                        </div>
                      )}

                      {paymentMode ===
                        "CASH" && (
                        <div className="mt-4">

                          <label className="mb-1 block text-sm font-medium">
                            Remarks
                          </label>

                          <input
                            type="text"
                            value={
                              paymentRemarks
                            }
                            onChange={(
                              event,
                            ) =>
                              setPaymentRemarks(
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Optional"
                            className="w-full rounded-xl border px-4 py-3"
                          />

                        </div>
                      )}

                      <button
                        type="button"
                        onClick={
                          addPayment
                        }
                        className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 font-bold text-white hover:bg-gray-800"
                      >
                        + Add Payment
                      </button>

                    </div>

                    {payments.length >
                      0 && (
                      <div className="rounded-xl border">

                        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">

                          <div className="font-semibold">
                            Payment Breakdown
                          </div>

                          <div className="text-sm font-bold">
                            Total Paid ₹
                            {paidAmount.toFixed(
                              2,
                            )}
                          </div>

                        </div>

                        {payments.map(
                          (
                            payment,
                          ) => (
                            <div
                              key={
                                payment.id
                              }
                              className="flex items-center justify-between border-b p-4 last:border-b-0"
                            >

                              <div>
                                <div className="font-semibold">
                                  {
                                    payment.paymentMode
                                  }
                                </div>

                                {payment.transactionNo && (
                                  <div className="text-xs text-gray-500">
                                    {
                                      payment.transactionNo
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4">

                                <span className="font-bold">
                                  ₹
                                  {(
                                    getNumber(
                                      payment.amount,
                                    ) +
                                    getNumber(
                                      payment.cardSurcharge,
                                    )
                                  ).toFixed(
                                    2,
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removePayment(
                                      payment.id,
                                    )
                                  }
                                  className="text-sm font-medium text-red-600 hover:underline"
                                >
                                  Remove
                                </button>

                              </div>

                            </div>
                          ),
                        )}

                      </div>
                    )}

                    <div className="rounded-xl border-2 border-gray-200 p-4">

                      <div className="grid gap-4 md:grid-cols-4">

                        <div>
                          <div className="text-xs text-gray-500">
                            Amount Payable
                          </div>

                          <div className="mt-1 text-lg font-bold">
                            ₹
                            {finalPayable.toFixed(
                              2,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Total Paid
                          </div>

                          <div className="mt-1 text-lg font-bold">
                            ₹
                            {paidAmount.toFixed(
                              2,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Balance
                          </div>

                          <div
                            className={`mt-1 text-lg font-bold ${
                              paymentBalance >
                              0.01
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            ₹
                            {paymentBalance.toFixed(
                              2,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Change / Return
                          </div>

                          <div className="mt-1 text-lg font-bold text-green-600">
                            ₹
                            {cashChange.toFixed(
                              2,
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-xs text-gray-500">
                F1 Cash · F2 UPI · F3 Card · F4 Credit · F5 Mixed · ESC Close
              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentOpen(
                      false,
                    )
                  }
                  className="rounded-xl border px-5 py-2.5 font-semibold hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    (!isCredit &&
                      paymentBalance >
                        0.01)
                  }
                  onClick={() =>
                    saveSale(
                      payments,
                    )
                  }
                  className="rounded-xl bg-black px-6 py-2.5 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? isEditMode
                      ? "Updating..."
                      : "Saving..."
                    : isEditMode
                      ? "UPDATE BILL"
                      : isCredit
                        ? "Save Credit Sale"
                        : "SAVE BILL"}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          RECALL HELD BILLS
          ===================================================== */}

      {recallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">
                Held Bills
              </h2>

              <button
                type="button"
                onClick={() =>
                  setRecallOpen(false)
                }
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {heldSales.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No bills are currently on hold.
                </div>
              ) : (
                <div className="space-y-3">
                  {heldSales.map((held) => {
                    const itemCount =
                      held.payload.items
                        ?.length ?? 0;

                    const total =
                      held.payload.items?.reduce(
                        (sum, item) =>
                          sum +
                          getNumber(item.qty) *
                            getNumber(
                              item.saleRate,
                            ),
                        0,
                      ) ?? 0;

                    return (
                      <div
                        key={held.id}
                        className="flex items-center justify-between rounded-xl border p-4"
                      >
                        <div>
                          <div className="font-semibold">
                            {held.holdName ||
                              "Held Bill"}
                          </div>

                          <div className="text-xs text-gray-500">
                            {itemCount} item
                            {itemCount === 1
                              ? ""
                              : "s"}{" "}
                            &middot; ₹
                            {total.toFixed(2)}{" "}
                            &middot;{" "}
                            {new Date(
                              held.updatedAt,
                            ).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              recallHeldSale(
                                held,
                              )
                            }
                            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                          >
                            Recall
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              discardHeldSale(
                                held.id,
                              )
                            }
                            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
