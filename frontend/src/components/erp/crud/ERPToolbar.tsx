"use client";

import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ERPToolbarProps {
  search?: string;
  searchPlaceholder?: string;

  onSearch?(value: string): void;
  onAdd?(): void;
  onRefresh?(): void;

  addLabel?: string;
  loading?: boolean;
}

export default function ERPToolbar({
  search = "",
  searchPlaceholder = "Search...",
  onSearch,
  onAdd,
  onRefresh,
  addLabel = "Add",
  loading = false,
}: ERPToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

        <Input
          value={search}
          placeholder={searchPlaceholder}
          className="pl-9"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={loading}
          onClick={onRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>

        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}