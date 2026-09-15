"use client";

import { ReactNode } from "react";

interface ERPFilterBarProps {
  children: ReactNode;
}

export default function ERPFilterBar({
  children,
}: ERPFilterBarProps) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div
        className="
          grid
          grid-cols-1
          gap-4
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        {children}
      </div>
    </div>
  );
}