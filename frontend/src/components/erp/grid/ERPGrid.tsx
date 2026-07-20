"use client";

import { ReactNode } from "react";

interface ERPGridProps {
  title?: string;

  toolbar?: ReactNode;

  footer?: ReactNode;

  children: ReactNode;
}

export default function ERPGrid({
  title,
  toolbar,
  footer,
  children,
}: ERPGridProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">

      {(title || toolbar) && (
        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">

          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          {toolbar}

        </div>
      )}

      <div className="overflow-auto">

        <table className="min-w-full border-collapse">

          {children}

        </table>

      </div>

      {footer && (
        <div className="border-t bg-slate-50">

          {footer}

        </div>
      )}

    </div>
  );
}