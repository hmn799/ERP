"use client";

import ERPTransactionGrid from "@/components/erp/transaction/ERPTransactionGrid";
import TransactionRow from "@/components/erp/transaction/TransactionRow";
import TransactionFooter from "@/components/erp/transaction/TransactionFooter";

import { useTransactionGrid } from "@/components/erp/transaction/hooks/useTransactionGrid";
import { calculatePurchaseTotals } from "@/core/pricing/purchase.totals";
import { ItemLookup } from "@/features/purchase/services/purchase.service";

export default function PurchaseItemsGrid() {
 const {
  rows,
  addRow,
  removeRow,
  updateField,
  updateRow,
} = useTransactionGrid();

const totals = calculatePurchaseTotals(rows);

function handleItemSelected(
  index: number,
  item: ItemLookup,
) {
  updateRow(index, {
    ...rows[index],

    itemId: item.id,
    itemCode: item.itemCode,
    itemName: item.name,

    barcode: item.barcode ?? "",

    purchaseRate: item.purchaseRate,
    retailRate: item.retailRate,
    wholesaleRate: item.wholesaleRate,
    distributorRate: item.distributorRate,

    mrp: item.mrp,

    gstPercent: item.gstPercent,
  });
}

  return (
    <div className="space-y-4">

      <ERPTransactionGrid
        title="Purchase Items"
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

    <th className="w-28 p-2 text-left">
      Batch
    </th>

    <th className="w-20 p-2 text-right">
      Qty
    </th>

    <th className="w-20 p-2 text-right">
      Free
    </th>

    <th className="w-24 p-2 text-right">
      P.Rate
    </th>

    <th className="w-24 p-2 text-right">
      Retail
    </th>

    <th className="w-24 p-2 text-right">
      Wholesale
    </th>

    <th className="w-28 p-2 text-right">
      Distributor
    </th>

    <th className="w-20 p-2 text-right">
      MRP
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

          {rows.map((row, index) => (
  <TransactionRow
    key={row.id || index}
    row={row}
    index={index}
    mode="purchase"
    onChange={updateField}
    onItemSelected={handleItemSelected}
    onDelete={removeRow}
  />
))}

        </tbody>

      </ERPTransactionGrid>

      <TransactionFooter
  totals={totals}
/>

    </div>
  );
}