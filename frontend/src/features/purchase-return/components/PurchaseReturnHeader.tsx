"use client";

import { Input } from "@/components/ui/input";

interface Props {
  returnDate: string;

  purchaseBillNo: string;

  supplierName: string;

  warehouseName: string;

  invoiceNo: string;
}

export default function PurchaseReturnHeader({
  returnDate,
  purchaseBillNo,
  supplierName,
  warehouseName,
  invoiceNo,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border bg-background p-4">
      <Input
        type="date"
        value={returnDate}
        readOnly
      />

      <Input
        value={purchaseBillNo}
        readOnly
        placeholder="Purchase Bill"
      />

      <Input
        value={supplierName}
        readOnly
        placeholder="Supplier"
      />

      <Input
        value={warehouseName}
        readOnly
        placeholder="Warehouse"
      />

      <Input
        value={invoiceNo}
        readOnly
        placeholder="Supplier Invoice"
      />
    </div>
  );
}