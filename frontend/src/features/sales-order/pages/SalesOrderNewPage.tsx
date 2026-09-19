"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import SalesOrderGrid from "../components/SalesOrderGrid";

export default function SalesOrderNewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">New Sales Order</h1>
          <p className="text-sm text-muted-foreground">
            Record what a customer has ordered, before it's billed.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/sales-order">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales Orders
          </Link>
        </Button>
      </div>

      <SalesOrderGrid />
    </div>
  );
}
