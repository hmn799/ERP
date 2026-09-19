"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

import itemService, {
  ItemBarcodesSummary,
} from "@/services/item/item.service";

interface ItemBarcodesPanelProps {
  itemId: string;
}

export default function ItemBarcodesPanel({
  itemId,
}: ItemBarcodesPanelProps) {
  const [summary, setSummary] =
    useState<ItemBarcodesSummary | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    itemService
      .getBarcodes(itemId)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const hasAnyBarcode =
    !!summary?.itemBarcode ||
    summary?.batches.some((b) => b.barcodes.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Every barcode ever scanned for this item, grouped by
        purchase batch. Add, remove, or change the primary
        barcode from Reports → Stock → Batch-wise → Barcodes.
      </p>

      {!hasAnyBarcode && (
        <div className="text-sm text-muted-foreground">
          No barcodes recorded for this item yet.
        </div>
      )}

      {summary?.itemBarcode && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            Item Master Barcode
          </div>

          <Badge variant="outline" className="font-mono">
            {summary.itemBarcode}
          </Badge>
        </div>
      )}

      {summary?.batches
        .filter((b) => b.barcodes.length > 0)
        .map((batch) => (
          <div key={batch.batchId} className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              Batch {batch.batchNo}
            </div>

            <div className="flex flex-wrap gap-2">
              {batch.barcodes.map((b) => (
                <Badge
                  key={b.id}
                  variant={b.isPrimary ? "secondary" : "outline"}
                  className="font-mono"
                >
                  {b.barcode}
                  {b.isPrimary && " · Primary"}
                </Badge>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
