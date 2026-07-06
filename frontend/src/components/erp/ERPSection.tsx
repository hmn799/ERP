"use client";

import { ReactNode } from "react";

interface ERPSectionProps {
  title: string;
  children: ReactNode;
}

export default function ERPSection({
  title,
  children,
}: ERPSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">
        {title}
      </h2>

      {children}
    </section>
  );
}