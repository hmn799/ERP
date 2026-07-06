"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ERPCardProps {
  children: ReactNode;
  className?: string;
}

export default function ERPCard({
  children,
  className,
}: ERPCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}