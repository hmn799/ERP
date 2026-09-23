"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import PettyExpenseService from "@/services/petty-expense/petty-expense.service";

const CATEGORIES = [
  "Tea/Refreshments",
  "Conveyance/Auto",
  "Stationery",
  "Cleaning",
  "Repairs",
  "Courier/Postage",
  "Miscellaneous",
];

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PettyExpenseWidget() {
  const queryClient = useQueryClient();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<
    "CASH" | "UPI" | "CARD"
  >("CASH");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["petty-expenses", "recent"],
    queryFn: () => PettyExpenseService.recent(6),
  });

  async function handleAdd() {
    const amountNum = Number(amount);

    if (!amountNum || amountNum <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      await PettyExpenseService.create({
        category,
        amount: amountNum,
        paymentMode,
        remarks: remarks.trim() || undefined,
      });

      toast.success(`₹${amountNum.toFixed(2)} logged.`);
      setAmount("");
      setRemarks("");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      });
    } catch {
      toast.error("Failed to log expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Petty Expenses</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={category}
            onValueChange={setCategory}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentMode}
            onValueChange={(v) =>
              setPaymentMode(v as "CASH" | "UPI" | "CARD")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            disabled={saving}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />

          <Input
            placeholder="Note (optional)"
            value={remarks}
            disabled={saving}
            onChange={(e) => setRemarks(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />

          <Button
            disabled={saving}
            onClick={handleAdd}
            className="shrink-0"
          >
            + Add
          </Button>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">
            Today: {data?.todayCount ?? 0} entries
          </span>

          <span className="font-semibold">
            ₹{money(data?.todayTotal ?? 0)}
          </span>
        </div>

        {data && data.entries.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {data.entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  {entry.category}
                  {entry.remarks
                    ? ` - ${entry.remarks}`
                    : ""}
                </span>

                <span className="font-medium">
                  ₹{money(Number(entry.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
