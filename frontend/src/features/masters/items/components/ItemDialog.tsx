"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import itemService from "@/services/item/item.service";

import type { Item } from "../types/item.types";

import ItemForm, {
  ItemFormValues,
} from "./ItemForm";
import ItemBarcodesPanel from "./ItemBarcodesPanel";

interface ItemDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  item?: Item;

  onSuccess?(): void;
}

export default function ItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: ItemDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: ItemFormValues,
  ) {
    try {
      setLoading(true);

      if (item) {
        await itemService.update(
          item.id,
          values,
        );

        toast.success("Item updated successfully.");
      } else {
        await itemService.create(values);

        toast.success("Item created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={item ? "Edit Item" : "New Item"}
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "item-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <Tabs
        key={item?.id ?? "new"}
        defaultValue="details"
      >
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>

          {item && (
            <TabsTrigger value="barcodes">
              Barcodes
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent
          value="details"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <ItemForm
            defaultValues={
              item
                ? {
                    name: item.name,
                    hsnCode: item.hsnCode ?? "",
                    barcode: item.barcode ?? "",
                    categoryId: item.categoryId,
                    subCategoryId:
                      item.subCategoryId ?? "",
                    brandId: item.brandId ?? "",
                    gstSlabId: item.gstSlabId,
                    baseUnitId: item.baseUnitId,
                    purchaseUnitId:
                      item.purchaseUnitId,
                    saleUnitId: item.saleUnitId,
                    mrp: item.mrp,
                    purchaseRate:
                      item.purchaseRate,
                    minQty: item.minQty ?? 0,
                    reorderQty:
                      item.reorderQty ?? 0,
                    isActive: item.isActive,
                  }
                : undefined
            }
            loading={loading}
            onSubmit={handleSubmit}
          />
        </TabsContent>

        {item && (
          <TabsContent
            value="barcodes"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <ItemBarcodesPanel itemId={item.id} />
          </TabsContent>
        )}
      </Tabs>
    </ERPFormDialog>
  );
}