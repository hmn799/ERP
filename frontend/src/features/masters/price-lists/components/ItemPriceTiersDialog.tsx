"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

import ItemPriceService, {
  ItemPrice,
} from "@/services/item-price/item-price.service";
import itemService from "@/services/item/item.service";

interface ItemPriceTiersDialogProps {
  priceListId: string | null;
  priceListName?: string;

  onOpenChange(open: boolean): void;
}

function errorMessage(error: unknown, fallback: string) {
  const message = (
    error as {
      response?: { data?: { message?: string | string[] } };
    }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message[0] ?? fallback;
  return message ?? fallback;
}

export default function ItemPriceTiersDialog({
  priceListId,
  priceListName,
  onOpenChange,
}: ItemPriceTiersDialogProps) {
  const [tiers, setTiers] = useState<ItemPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [itemId, setItemId] = useState("");
  const [minQty, setMinQty] = useState("1");
  const [salePrice, setSalePrice] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["item-price", "items"],
    queryFn: itemService.getAll,
  });

  async function refresh() {
    if (!priceListId) return;

    setLoading(true);

    try {
      setTiers(
        await ItemPriceService.getByPriceList(
          priceListId,
        ),
      );
    } catch {
      toast.error("Failed to load item rates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (priceListId) {
      refresh();
    } else {
      setTiers([]);
    }

    setItemId("");
    setMinQty("1");
    setSalePrice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceListId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ItemPrice[]>();

    for (const tier of tiers) {
      const key = tier.itemId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tier);
    }

    for (const rows of map.values()) {
      rows.sort((a, b) => Number(a.minQty) - Number(b.minQty));
    }

    return Array.from(map.entries()).sort((a, b) => {
      const nameA = a[1][0]?.item?.name ?? "";
      const nameB = b[1][0]?.item?.name ?? "";
      return nameA.localeCompare(nameB);
    });
  }, [tiers]);

  async function handleAdd() {
    if (!priceListId) return;

    if (!itemId) {
      toast.error("Select an item.");
      return;
    }

    const minQtyNum = Number(minQty);
    const salePriceNum = Number(salePrice);

    if (!minQtyNum || minQtyNum <= 0) {
      toast.error("Enter a valid min qty.");
      return;
    }

    if (!salePriceNum || salePriceNum < 0) {
      toast.error("Enter a valid rate.");
      return;
    }

    try {
      setSaving(true);

      await ItemPriceService.create({
        itemId,
        priceListId,
        minQty: minQtyNum,
        salePrice: salePriceNum,
      });

      setMinQty("1");
      setSalePrice("");
      await refresh();

      toast.success("Rate tier added.");
    } catch (error) {
      toast.error(
        errorMessage(error, "Failed to add rate tier."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(tier: ItemPrice) {
    try {
      await ItemPriceService.remove(tier.id);
      await refresh();
      toast.success("Rate tier removed.");
    } catch (error) {
      toast.error(
        errorMessage(error, "Failed to remove rate tier."),
      );
    }
  }

  return (
    <Dialog
      open={!!priceListId}
      onOpenChange={(value) => !value && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Item Rates{priceListName ? ` - ${priceListName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Set qty-wise rates per item on this price list. A
            customer assigned to this list (or every walk-in sale,
            if this is the default list) automatically gets the
            rate for whichever tier their billed qty reaches.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_7rem_8rem_auto] items-end gap-2 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label>Item</Label>
            <select
              value={itemId}
              disabled={saving}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full rounded border bg-white px-2 py-2 text-sm"
            >
              <option value="">Select item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} - {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Min Qty</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={minQty}
              disabled={saving}
              onChange={(e) => setMinQty(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Rate</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              disabled={saving}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </div>

          <Button
            type="button"
            disabled={saving}
            onClick={handleAdd}
          >
            Add Tier
          </Button>
        </div>

        <div className="max-h-96 space-y-4 overflow-y-auto">
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading...
            </div>
          )}

          {!loading && grouped.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No item rates on this price list yet.
            </div>
          )}

          {grouped.map(([id, rows]) => (
            <div key={id} className="space-y-1.5">
              <div className="text-sm font-medium">
                {rows[0]?.item
                  ? `${rows[0].item.itemCode} - ${rows[0].item.name}`
                  : id}
              </div>

              <div className="flex flex-wrap gap-2">
                {rows.map((tier) => (
                  <Badge
                    key={tier.id}
                    variant="outline"
                    className="flex items-center gap-2 py-1.5 pl-3 pr-1.5 font-mono"
                  >
                    {Number(tier.minQty)}+ qty &rarr; &#8377;
                    {Number(tier.salePrice).toFixed(2)}
                    <button
                      type="button"
                      onClick={() => handleRemove(tier)}
                      className="rounded p-0.5 hover:bg-red-100"
                      title="Remove tier"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
