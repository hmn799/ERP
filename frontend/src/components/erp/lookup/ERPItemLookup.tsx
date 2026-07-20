"use client";

import { useEffect, useMemo, useState } from "react";

import ERPLookup from "./ERPLookup";

import {
  getItemLookup,
  ItemLookup,
} from "@/features/purchase/services/purchase.service";

interface Props {
  value: string;

  onSelect(item: ItemLookup): void;
}

export default function ERPItemLookup({
  value,
  onSelect,
}: Props) {
  const [allItems, setAllItems] = useState<ItemLookup[]>([]);

  const [search, setSearch] = useState(value);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    setLoading(true);

    getItemLookup()
      .then(setAllItems)
      .finally(() =>
        setLoading(false),
      );
  }, []);

  const filtered = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) {
      return [];
    }

    return allItems
      .filter(
        (item) =>
          item.name
            .toLowerCase()
            .includes(q) ||
          item.itemCode
            .toLowerCase()
            .includes(q) ||
          (item.barcode ?? "")
            .toLowerCase()
            .includes(q),
      )
      .map((item) => ({
        ...item,

        code: item.itemCode,
      }));
  }, [allItems, search]);

  return (
    <ERPLookup
      value={search}
      items={filtered}
      loading={loading}
      placeholder="Search item..."
      onSearch={setSearch}
      onSelect={(item) => {
        setSearch(item.name);

        onSelect(item);
      }}
      getSubtitle={(item) =>
        `₹ ${item.purchaseRate} • GST ${item.gstPercent}%`
      }
    />
  );
}