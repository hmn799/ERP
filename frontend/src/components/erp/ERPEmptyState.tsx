"use client";

import { PackageOpen } from "lucide-react";

interface ERPEmptyStateProps {
  title: string;
  description: string;
}

export default function ERPEmptyState({
  title,
  description,
}: ERPEmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed bg-white text-center">

      <PackageOpen className="mb-4 h-14 w-14 text-muted-foreground" />

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

    </div>
  );
}