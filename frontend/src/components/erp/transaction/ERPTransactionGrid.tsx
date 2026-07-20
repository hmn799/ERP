"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ERPTransactionGridProps<T> {
  title?: string;
  data: T[];
  children: ReactNode;
  onAddRow?(): void;
}

export default function ERPTransactionGrid<T>({
  title = "Items",
  data,
  children,
  onAddRow,
}: ERPTransactionGridProps<T>) {
  return (
    <div className="rounded-lg border bg-background shadow-sm">

      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        <Button
          type="button"
          variant="outline"
          onClick={onAddRow}
        >
          + Add Row
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {children}
        </table>
      </div>

      <div className="border-t px-4 py-2 text-sm text-muted-foreground">
        Total Rows : {data.length}
      </div>

    </div>
  );
}