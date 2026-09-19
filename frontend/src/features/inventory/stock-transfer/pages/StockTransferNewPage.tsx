"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ROUTES } from "@/config/routes";

import StockTransferGrid from "../components/StockTransferGrid";

export default function StockTransferNewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">New Stock Transfer</h1>
          <p className="text-sm text-muted-foreground">
            Move stock from one warehouse to another.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={ROUTES.STOCK_TRANSFER}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock Transfers
          </Link>
        </Button>
      </div>

      <StockTransferGrid />
    </div>
  );
}
