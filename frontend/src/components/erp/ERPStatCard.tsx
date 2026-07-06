"use client";

import { ReactNode } from "react";
import ERPCard from "./ERPCard";

interface ERPStatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  footer?: ReactNode;
}

export default function ERPStatCard({
  title,
  value,
  icon,
  footer,
}: ERPStatCardProps) {
  return (
    <ERPCard>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {value}
          </h2>
        </div>

        {icon && (
          <div className="rounded-xl bg-primary/10 p-3">
            {icon}
          </div>
        )}
      </div>

      {footer && (
        <div className="mt-5">
          {footer}
        </div>
      )}
    </ERPCard>
  );
}