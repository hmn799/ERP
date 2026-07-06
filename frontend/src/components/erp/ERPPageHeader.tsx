"use client";

import { ReactNode } from "react";

interface ERPPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function ERPPageHeader({
  title,
  subtitle,
  actions,
}: ERPPageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}