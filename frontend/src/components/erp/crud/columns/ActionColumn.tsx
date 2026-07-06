"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ActionColumnProps<T> {
  row: T;
  onEdit?(row: T): void;
  onDelete?(row: T): void;
}

export default function ActionColumn<T>({
  row,
  onEdit,
  onDelete,
}: ActionColumnProps<T>) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={() => onEdit?.(row)}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="destructive"
        onClick={() => onDelete?.(row)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}