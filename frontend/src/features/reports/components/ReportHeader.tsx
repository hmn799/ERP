"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReportHeaderProps {
  title: string;
  description?: string;

  search?: string;
  onSearch?(value: string): void;
  searchPlaceholder?: string;

  onExport?(): void;
  exportDisabled?: boolean;
}

export default function ReportHeader({
  title,
  description,
  search,
  onSearch,
  searchPlaceholder = "Search...",
  onExport,
  exportDisabled,
}: ReportHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSearch && (
          <Input
            value={search}
            placeholder={searchPlaceholder}
            className="w-56"
            onChange={(e) =>
              onSearch(e.target.value)
            }
          />
        )}

        {onExport && (
          <Button
            type="button"
            variant="outline"
            disabled={exportDisabled}
            onClick={onExport}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>
    </div>
  );
}
