"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ERPBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function ERPBadge({
  children,
  className,
}: ERPBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium",
        className
      )}
    >
      {children}
    </Badge>
  );
}