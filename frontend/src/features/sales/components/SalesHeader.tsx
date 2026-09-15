"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CustomerLookup,
  WarehouseLookup,
} from "../types/sales.types";

interface SalesHeaderProps {
  billNo: string;
  billDate: string;

  customerId: string;
  warehouseId: string;

  customers: CustomerLookup[];
  warehouses: WarehouseLookup[];

  isCredit: boolean;

  isEditMode?: boolean;

  customerOutstanding?: number;
  customerLedgerLoading?: boolean;

  onBillNoChange: (value: string) => void;
  onBillDateChange: (value: string) => void;
  onCustomerChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onCreditChange: (value: boolean) => void;

  onCreateCustomer: (data: {
    name: string;
    mobile: string;
    customerGroup: string;
    priceLevel: string;
    gstCategory: string;
    creditLimit: number;
  }) => Promise<void>;
}

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SalesHeader({
  billNo,
  billDate,
  customerId,
  warehouseId,
  customers,
  warehouses,
  isCredit,
  isEditMode = false,
  customerOutstanding = 0,
  customerLedgerLoading = false,
  onBillNoChange,
  onBillDateChange,
  onCustomerChange,
  onWarehouseChange,
  onCreditChange,
  onCreateCustomer,
}: SalesHeaderProps) {
  const searchRef =
    useRef<HTMLInputElement>(null);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [showCustomerResults, setShowCustomerResults] =
    useState(false);

  const [selectedCustomerIndex, setSelectedCustomerIndex] =
    useState(0);

  const [showCreateCustomer, setShowCreateCustomer] =
    useState(false);

  const [creatingCustomer, setCreatingCustomer] =
    useState(false);

  const [newCustomerName, setNewCustomerName] =
    useState("");

  const [newCustomerMobile, setNewCustomerMobile] =
    useState("");

  const [newCustomerGroup, setNewCustomerGroup] =
    useState("Retail");

  const [newCustomerPriceLevel, setNewCustomerPriceLevel] =
    useState("Retail");

  const [newCustomerGstCategory, setNewCustomerGstCategory] =
    useState("Unregistered");

  const [newCustomerCreditLimit, setNewCustomerCreditLimit] =
    useState(0);

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.id === customerId,
    );

  /*
   * =====================================================
   * CUSTOMER SEARCH RESULTS
   * =====================================================
   */

  const customerResults =
    useMemo(() => {
      const term =
        customerSearch
          .trim()
          .toLowerCase();

      if (!term) {
        return [];
      }

      return customers
        .filter((customer) => {
          return [
            customer.name,
            customer.customerCode,
            customer.mobile ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(term);
        })
        .slice(0, 8);
    }, [
      customers,
      customerSearch,
    ]);

  /*
   * Reset highlighted result whenever
   * the search text changes.
   */

  useEffect(() => {
    setSelectedCustomerIndex(0);
  }, [customerSearch]);

  /*
   * =====================================================
   * SELECT CUSTOMER
   * =====================================================
   */

  function selectCustomer(
    customer: CustomerLookup,
  ) {
    onCustomerChange(customer.id);

    setCustomerSearch(customer.name);

    setShowCustomerResults(false);

    setSelectedCustomerIndex(0);

    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  }

  /*
   * =====================================================
   * OPEN CREATE CUSTOMER
   * =====================================================
   */

  function openCreateCustomer() {
    setNewCustomerName(
      customerSearch.trim(),
    );

    setShowCustomerResults(false);

    setShowCreateCustomer(true);
  }

  /*
   * =====================================================
   * CREATE CUSTOMER
   * =====================================================
   */

  async function handleCreateCustomer() {
    const name =
      newCustomerName.trim();

    if (!name) {
      return;
    }

    try {
      setCreatingCustomer(true);

      await onCreateCustomer({
        name,
        mobile:
          newCustomerMobile.trim(),
        customerGroup:
          newCustomerGroup,
        priceLevel:
          newCustomerPriceLevel,
        gstCategory:
          newCustomerGstCategory,
        creditLimit:
          Number(
            newCustomerCreditLimit,
          ) || 0,
      });

      setShowCreateCustomer(false);

      setNewCustomerName("");
      setNewCustomerMobile("");
      setNewCustomerCreditLimit(0);
    } finally {
      setCreatingCustomer(false);
    }
  }

  /*
   * =====================================================
   * CUSTOMER KEYBOARD NAVIGATION
   * =====================================================
   */

  function handleCustomerKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Escape") {
      setCustomerSearch(
        selectedCustomer?.name ?? "",
      );

      setShowCustomerResults(false);

      setSelectedCustomerIndex(0);

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (
        customerResults.length === 0
      ) {
        return;
      }

      setShowCustomerResults(true);

      setSelectedCustomerIndex(
        (current) =>
          current >=
          customerResults.length - 1
            ? 0
            : current + 1,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (
        customerResults.length === 0
      ) {
        return;
      }

      setShowCustomerResults(true);

      setSelectedCustomerIndex(
        (current) =>
          current <= 0
            ? customerResults.length - 1
            : current - 1,
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        customerResults.length > 0
      ) {
        selectCustomer(
          customerResults[
            selectedCustomerIndex
          ],
        );

        return;
      }

      if (
        customerSearch.trim()
      ) {
        openCreateCustomer();
      }
    }
  }

  /*
   * =====================================================
   * CUSTOMER CREDIT
   * =====================================================
   */

  const creditLimit =
    Number(
      selectedCustomer?.creditLimit ??
        0,
    );

  const availableCredit =
    creditLimit -
    customerOutstanding;

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <>
      <div className="rounded-lg border bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isEditMode
                ? "Edit Sale"
                : "New Sale"}
            </h2>

            <p className="text-sm text-gray-500">
              {isEditMode
                ? `Editing ${billNo}`
                : "Fast billing"}
            </p>
          </div>

          {selectedCustomer && (
            <div className="rounded-md bg-gray-50 px-4 py-2 text-right">
              <div className="text-xs text-gray-500">
                Customer
              </div>

              <div className="font-semibold">
                {selectedCustomer.name}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* BILL NO */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Bill No.
            </label>

            <input
              value={billNo}
              readOnly={!isEditMode}
              onChange={(event) =>
                onBillNoChange(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder={
                isEditMode
                  ? "Bill number"
                  : "Auto generated on save"
              }
            />
          </div>

          {/* BILL DATE */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Bill Date
            </label>

            <input
              type="datetime-local"
              value={billDate}
              onChange={(event) =>
                onBillDateChange(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          {/* CUSTOMER */}

          <div className="relative">
            <label className="mb-1 block text-sm font-medium">
              Customer
            </label>

            <input
              ref={searchRef}
              value={customerSearch}
              onChange={(event) => {
                setCustomerSearch(
                  event.target.value,
                );

                setShowCustomerResults(
                  true,
                );
              }}
              onFocus={() =>
                setShowCustomerResults(
                  true,
                )
              }
              onKeyDown={
                handleCustomerKeyDown
              }
              className="w-full rounded-md border-2 px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Name / code / mobile..."
            />

            {showCustomerResults &&
              customerSearch.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white shadow-xl">
                  {customerResults.length >
                  0 ? (
                    <>
                      {customerResults.map(
                        (
                          customer,
                          index,
                        ) => {
                          const isSelected =
                            index ===
                            selectedCustomerIndex;

                          return (
                            <button
                              key={
                                customer.id
                              }
                              type="button"
                              onMouseEnter={() =>
                                setSelectedCustomerIndex(
                                  index,
                                )
                              }
                              onMouseDown={(
                                event,
                              ) => {
                                event.preventDefault();

                                selectCustomer(
                                  customer,
                                );
                              }}
                              className={`flex w-full items-center justify-between border-b px-3 py-3 text-left last:border-b-0 ${
                                isSelected
                                  ? "bg-gray-100"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div>
                                <div className="font-medium">
                                  {
                                    customer.name
                                  }
                                </div>

                                <div className="text-xs text-gray-500">
                                  {
                                    customer.customerCode
                                  }

                                  {customer.mobile
                                    ? ` • ${customer.mobile}`
                                    : ""}
                                </div>
                              </div>

                              {isSelected && (
                                <span className="text-xs text-gray-500">
                                  Enter
                                </span>
                              )}
                            </button>
                          );
                        },
                      )}

                      <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        ↑ ↓ Select &nbsp; • &nbsp;
                        Enter Confirm &nbsp; • &nbsp;
                        Esc Close
                      </div>
                    </>
                  ) : (
                    <div className="p-3">
                      <div className="text-sm text-gray-500">
                        No customer found.
                      </div>

                      <button
                        type="button"
                        onMouseDown={(
                          event,
                        ) => {
                          event.preventDefault();

                          openCreateCustomer();
                        }}
                        className="mt-2 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
                      >
                        + Create Customer
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* CUSTOMER SUMMARY */}

            {selectedCustomer && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border bg-gray-50 p-2">
                  <div className="text-gray-500">
                    Outstanding
                  </div>

                  <div className="font-semibold">
                    {customerLedgerLoading
                      ? "Loading..."
                      : `₹${money(
                          customerOutstanding,
                        )}`}
                  </div>
                </div>

                <div className="rounded border bg-gray-50 p-2">
                  <div className="text-gray-500">
                    Credit Limit
                  </div>

                  <div className="font-semibold">
                    ₹
                    {money(
                      creditLimit,
                    )}
                  </div>
                </div>

                <div
                  className={`rounded border p-2 ${
                    availableCredit < 0
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="text-gray-500">
                    Available
                  </div>

                  <div className="font-semibold">
                    ₹
                    {money(
                      availableCredit,
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* WAREHOUSE */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Warehouse
            </label>

            <select
              value={warehouseId}
              onChange={(event) =>
                onWarehouseChange(
                  event.target.value,
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
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
        </div>

        {/* CREDIT */}

        <div className="mt-4 flex items-center gap-2">
          <input
            id="isCredit"
            type="checkbox"
            checked={isCredit}
            onChange={(event) =>
              onCreditChange(
                event.target.checked,
              )
            }
            className="h-4 w-4"
          />

          <label
            htmlFor="isCredit"
            className="text-sm font-medium"
          >
            Credit Sale
          </label>
        </div>

        {isCredit &&
          selectedCustomer &&
          availableCredit < 0 && (
            <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              ⚠️ Credit limit exceeded.
              You can continue with this
              sale.
            </div>
          )}
      </div>

      {/* CREATE CUSTOMER MODAL */}

      {showCreateCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
            <div className="border-b px-5 py-4">
              <h3 className="text-lg font-semibold">
                Create Customer
              </h3>

              <p className="text-sm text-gray-500">
                Create without leaving the
                billing screen.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Name *
                </label>

                <input
                  autoFocus
                  value={newCustomerName}
                  onChange={(event) =>
                    setNewCustomerName(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Mobile
                </label>

                <input
                  value={newCustomerMobile}
                  onChange={(event) =>
                    setNewCustomerMobile(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Customer Group
                  </label>

                  <select
                    value={
                      newCustomerGroup
                    }
                    onChange={(event) =>
                      setNewCustomerGroup(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option>
                      Retail
                    </option>
                    <option>
                      Wholesale
                    </option>
                    <option>
                      Distributor
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Price Level
                  </label>

                  <select
                    value={
                      newCustomerPriceLevel
                    }
                    onChange={(event) =>
                      setNewCustomerPriceLevel(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option>
                      Retail
                    </option>
                    <option>
                      Wholesale
                    </option>
                    <option>
                      Distributor
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    GST Category
                  </label>

                  <select
                    value={
                      newCustomerGstCategory
                    }
                    onChange={(event) =>
                      setNewCustomerGstCategory(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option>
                      Unregistered
                    </option>
                    <option>
                      Registered
                    </option>
                    <option>
                      Composition
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Credit Limit
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      newCustomerCreditLimit
                    }
                    onChange={(event) =>
                      setNewCustomerCreditLimit(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-md border px-3 py-2 text-right"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button
                type="button"
                disabled={creatingCustomer}
                onClick={() =>
                  setShowCreateCustomer(false)
                }
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  creatingCustomer ||
                  !newCustomerName.trim()
                }
                onClick={
                  handleCreateCustomer
                }
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creatingCustomer
                  ? "Creating..."
                  : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
