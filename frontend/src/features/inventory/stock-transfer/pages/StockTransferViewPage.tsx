"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { ROUTES } from "@/config/routes";

import StockTransferService from "@/services/stock-transfer/stock-transfer.service";

interface StockTransferViewPageProps {
  transferId: string;
}

export default function StockTransferViewPage({
  transferId,
}: StockTransferViewPageProps) {
  const router = useRouter();

  const { data: transfer, isLoading } = useQuery({
    queryKey: ["stock-transfer", transferId],
    queryFn: () => StockTransferService.get(transferId),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);

      await StockTransferService.remove(transferId);

      toast.success("Stock transfer deleted.");

      router.push(ROUTES.STOCK_TRANSFER);
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Unable to delete this transfer.",
      );
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (isLoading || !transfer) {
    return (
      <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground shadow-sm">
        Loading stock transfer...
      </div>
    );
  }

  const totalQty = transfer.items.reduce(
    (sum, item) => sum + Number(item.qty),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{transfer.transferNo}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(transfer.transferDate).toLocaleDateString()} ·{" "}
            {transfer.fromWarehouse.name} &rarr; {transfer.toWarehouse.name}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={ROUTES.STOCK_TRANSFER}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {transfer.remarks && (
        <div className="rounded-lg border bg-background p-4 text-sm shadow-sm">
          <span className="font-medium">Remarks: </span>
          {transfer.remarks}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-white">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Batch</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-left">Expiry</th>
              <th className="px-4 py-3 text-right">Qty</th>
            </tr>
          </thead>

          <tbody>
            {transfer.items.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  {item.item.itemCode} - {item.item.name}
                </td>
                <td className="px-4 py-3">{item.batch.batchNo}</td>
                <td className="px-4 py-3 text-right">
                  &#8377;{Number(item.batch.mrp).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {item.batch.expiryDate
                    ? new Date(item.batch.expiryDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right">{Number(item.qty)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t bg-gray-50 font-medium">
              <td className="px-4 py-3" colSpan={4}>
                Total
              </td>
              <td className="px-4 py-3 text-right">{totalQty}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Stock Transfer"
        description={`Delete transfer "${transfer.transferNo}"? This reverses the stock movement.`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      {deleting && (
        <div className="text-sm text-muted-foreground">Deleting...</div>
      )}
    </div>
  );
}
