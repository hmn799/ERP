"use client";

import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MasterToolbarProps {
  title: string;
  search: string;
  onSearchChange(value: string): void;
  onAdd(): void;
  onRefresh?(): void;
}

export default function MasterToolbar({
  title,
  search,
  onSearchChange,
  onAdd,
  onRefresh,
}: MasterToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-3 text-muted-foreground"
          />

          <Input
            className="pl-9 w-64"
            placeholder="Search..."
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
          />
        </div>

        <Button
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>

        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}