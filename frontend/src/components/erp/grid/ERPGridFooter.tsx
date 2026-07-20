"use client";

import { ReactNode } from "react";

interface ERPGridFooterProps {
  children: ReactNode;
}

export default function ERPGridFooter({
  children,
}: ERPGridFooterProps) {
  return (
    <div className="p-3">

      {children}

    </div>
  );
}