"use client";

import { ReactNode } from "react";

interface ERPGridHeaderProps {
  children: ReactNode;
}

export default function ERPGridHeader({
  children,
}: ERPGridHeaderProps) {
  return (
    <thead className="sticky top-0 z-10 bg-slate-100">

      {children}

    </thead>
  );
}