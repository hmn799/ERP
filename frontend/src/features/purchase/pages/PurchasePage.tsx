"use client";

import { useState } from "react";

import PurchaseHeader from "../components/PurchaseHeader";
import PurchaseItemsGrid from "../components/PurchaseItemsGrid";
import PurchaseActions from "../components/PurchaseActions";

export default function PurchasePage() {
  const [supplierId, setSupplierId] = useState("");

  const [warehouseId, setWarehouseId] = useState("");

  const [billDate, setBillDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

  const [invoiceNo, setInvoiceNo] = useState("");

  function handleSave() {
    console.log("Save Purchase");
  }

  function handleSaveAndNew() {
    console.log("Save & New");
  }

  function handleClear() {
    console.log("Clear Purchase");
  }

  return (
    <div className="space-y-6">
      <PurchaseHeader
        supplierId={supplierId}
        warehouseId={warehouseId}
        billDate={billDate}
        invoiceNo={invoiceNo}
        onSupplierChange={setSupplierId}
        onWarehouseChange={setWarehouseId}
        onBillDateChange={setBillDate}
        onInvoiceNoChange={setInvoiceNo}
      />

      <PurchaseItemsGrid />

      <PurchaseActions
        onSave={handleSave}
        onSaveAndNew={handleSaveAndNew}
        onClear={handleClear}
      />
    </div>
  );
}