"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ROUTES } from "@/config/routes";

import OpeningStockBulkGrid from "../components/OpeningStockBulkGrid";

export default function OpeningStockBulkPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bulk Opening Stock Entry</h1>
          <p className="text-sm text-muted-foreground">
            Add opening stock for multiple items in one warehouse at once.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={ROUTES.OPENING_STOCK}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opening Stock
          </Link>
        </Button>
      </div>

      <OpeningStockBulkGrid />
    </div>
  );
}
