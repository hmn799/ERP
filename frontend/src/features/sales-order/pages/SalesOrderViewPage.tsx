"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import SalesOrderService from "@/services/sales-order/sales-order.service";
import {
  getWarehouseStock,
  type WarehouseStockRow,
} from "@/services/warehouse/warehouse-stock.service";

interface SalesOrderViewPageProps {
  salesOrderId: string;
}

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "border-green-200 bg-green-50 text-green-700",
  PARTIAL: "border-yellow-200 bg-yellow-50 text-yellow-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  PENDING: "border-gray-200 bg-white text-gray-700",
};

function getNumber(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

interface FulfillRow {
  batchId: string;
  qty: string;
}

export default function SalesOrderViewPage({
  salesOrderId,
}: SalesOrderViewPageProps) {
  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["sales-order", salesOrderId],
    queryFn: () => SalesOrderService.get(salesOrderId),
  });

  const [stock, setStock] = useState<WarehouseStockRow[]>([]);
  const [fulfillRows, setFulfillRows] = useState<
    Record<string, FulfillRow>
  >({});
  const [fulfilling, setFulfilling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const items = order?.items ?? [];

  const pendingItems = useMemo(
    () => items.filter((item) => getNumber(item.pendingQty) > 0),
    [items],
  );

  const canFulfill =
    order !== undefined &&
    order !== null &&
    order.status !== "CANCELLED" &&
    order.status !== "COMPLETED" &&
    pendingItems.length > 0;

  const canCancel = order?.status === "PENDING";

  useEffect(() => {
    if (!order?.warehouseId || !canFulfill) return;

    getWarehouseStock(order.warehouseId).then(setStock);
  }, [order?.warehouseId, canFulfill]);

  function updateFulfillRow(
    itemId: string,
    patch: Partial<FulfillRow>,
  ) {
    setFulfillRows((prev) => {
      const base: FulfillRow = prev[itemId] ?? { batchId: "", qty: "" };

      return {
        ...prev,
        [itemId]: { ...base, ...patch },
      };
    });
  }

  async function handleFulfill() {
    if (!order) return;

    const linesToFulfill = pendingItems
      .map((item) => ({
        salesOrderItemId: item.id,
        batchId: fulfillRows[item.id]?.batchId || "",
        qty: Number(fulfillRows[item.id]?.qty || 0),
      }))
      .filter((line) => line.batchId && line.qty > 0);

    if (linesToFulfill.length === 0) {
      toast.error("Select a batch and quantity for at least one item.");
      return;
    }

    for (const line of linesToFulfill) {
      const soItem = pendingItems.find((i) => i.id === line.salesOrderItemId);
      const pending = getNumber(soItem?.pendingQty);

      if (line.qty > pending) {
        toast.error(
          `Quantity for ${soItem?.item?.name} exceeds pending quantity (${pending}).`,
        );
        return;
      }
    }

    try {
      setFulfilling(true);

      const result = await SalesOrderService.fulfill(order.id, {
        items: linesToFulfill,
      });

      toast.success(
        `Sales bill ${result.salesBill?.billNo ?? ""} created.`,
      );

      setFulfillRows({});
      refetch();
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to fulfill sales order.",
      );
    } finally {
      setFulfilling(false);
    }
  }

  async function handleCancel() {
    if (!order) return;

    try {
      setCancelling(true);

      await SalesOrderService.cancel(order.id);

      toast.success("Sales order cancelled.");

      refetch();
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string" ? message : "Failed to cancel order.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading || !order) {
    return (
      <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground shadow-sm">
        Loading sales order...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{order.soNo}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.soDate).toLocaleDateString()} ·{" "}
            {order.customer?.name || "Walk-in"} · {order.warehouse?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
              STATUS_CLASS[order.status] ?? STATUS_CLASS.PENDING
            }`}
          >
            {order.status}
          </span>

          {canCancel && (
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}

          <Button variant="outline" asChild>
            <Link href="/sales-order">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {order.remarks && (
        <div className="rounded-lg border bg-background p-4 text-sm shadow-sm">
          <span className="font-medium">Remarks: </span>
          {order.remarks}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Order Items</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b bg-white">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-right">Ordered</th>
              <th className="px-4 py-3 text-right">Delivered</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Net</th>

              {canFulfill && (
                <>
                  <th className="px-4 py-3 text-left">Fulfil From Batch</th>
                  <th className="w-28 px-4 py-3 text-right">Fulfil Qty</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const pending = getNumber(item.pendingQty);
              const isPending = pending > 0;
              const batchOptions = stock.filter(
                (s) => s.itemId === item.itemId,
              );
              const row = fulfillRows[item.id];

              return (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    {item.item?.itemCode} - {item.item?.name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {getNumber(item.qtyOrdered)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {getNumber(item.qtyDelivered)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {pending}
                  </td>
                  <td className="px-4 py-3 text-right">
                    &#8377;{getNumber(item.saleRate).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    &#8377;{getNumber(item.netAmount).toFixed(2)}
                  </td>

                  {canFulfill && (
                    <>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <select
                            value={row?.batchId ?? ""}
                            disabled={fulfilling}
                            onChange={(e) =>
                              updateFulfillRow(item.id, {
                                batchId: e.target.value,
                                qty: String(
                                  Math.min(
                                    pending,
                                    batchOptions.find(
                                      (b) => b.batchId === e.target.value,
                                    )?.quantity ?? 0,
                                  ),
                                ),
                              })
                            }
                            className="h-9 w-full rounded-md border px-2 text-sm outline-none focus:ring-2"
                          >
                            <option value="">Select batch...</option>
                            {batchOptions.map((b) => (
                              <option key={b.batchId} value={b.batchId}>
                                {b.batch.batchNo} (Avail: {b.quantity})
                              </option>
                            ))}
                          </select>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isPending && (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="text-right"
                            disabled={fulfilling || !row?.batchId}
                            value={row?.qty ?? ""}
                            onChange={(e) =>
                              updateFulfillRow(item.id, {
                                qty: e.target.value,
                              })
                            }
                          />
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canFulfill && (
        <div className="flex justify-end">
          <Button disabled={fulfilling} onClick={handleFulfill}>
            {fulfilling ? "Creating Sales Bill..." : "Create Sales Bill"}
          </Button>
        </div>
      )}

      {order.salesBills && order.salesBills.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Sales Bills From This Order</h2>
          </div>

          <div className="divide-y">
            {order.salesBills.map((bill) => (
              <Link
                key={bill.id}
                href={`/sales/view/${bill.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
              >
                <span className="font-medium">{bill.billNo}</span>
                <span className="text-muted-foreground">
                  {new Date(bill.billDate).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
