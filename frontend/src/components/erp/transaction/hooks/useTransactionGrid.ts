"use client";

import { useState } from "react";

import { TransactionRowModel } from "../transaction.types";

import {
  calculatePurchaseRow,
  PurchaseTaxMode,
} from "@/core/pricing/purchase.calculator";

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

export function useTransactionGrid(
  taxMode: PurchaseTaxMode = "EXCLUSIVE",
) {
  const [rows, setRows] =
    useState<TransactionRowModel[]>([
      createEmptyRow(),
    ]);

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

        const updatedRow = {
          ...row,
          [field]: value,
        };

        return calculatePurchaseRow(
          updatedRow,
          taxMode,
        );
      }),
    );
  }

  /*
   * Re-derives every row's tax fields under the current taxMode -
   * called when the bill-level Inclusive/Exclusive toggle changes,
   * so already-entered rows update immediately rather than only on
   * their next edit.
   */
  function recalculateAll() {
    setRows((prev) =>
      prev.map((row) =>
        calculatePurchaseRow(row, taxMode),
      ),
    );
  }

  function updateRow(
    index: number,
    row: TransactionRowModel,
  ) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? row : r,
      ),
    );
  }

  function setLoadedRows(
    loadedRows: TransactionRowModel[],
  ) {
    setRows(
      loadedRows.length
        ? loadedRows
        : [createEmptyRow()],
    );
  }

  function resetRows() {
    setRows([createEmptyRow()]);
  }

  return {
    rows,
    addRow,
    removeRow,
    updateField,
    updateRow,
    setLoadedRows,
    resetRows,
    recalculateAll,
  };
}
