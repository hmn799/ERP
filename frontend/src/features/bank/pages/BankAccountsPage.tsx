"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import BankAccountService from "@/services/bank/bank-account.service";

export default function BankAccountsPage() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
  });

  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  const createMutation = useMutation({
    mutationFn: () =>
      BankAccountService.create({
        name,
        bankName,
        accountNumber,
        ifscCode: ifscCode || undefined,
        openingBalance: Number(openingBalance) || 0,
      }),
    onSuccess: () => {
      toast.success("Bank account added.");
      setName("");
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setOpeningBalance("0");
      queryClient.invalidateQueries({
        queryKey: ["bank-accounts"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to add bank account.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => BankAccountService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank-accounts"],
      });
    },
    onError: () => {
      toast.error("Failed to update bank account.");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bank Accounts</h1>
        <p className="text-sm text-muted-foreground">
          The business's own bank accounts, used to tag
          receipts/payments and reconcile against bank
          statements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Add Bank Account
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <Input
              placeholder="Account name (e.g. Main Current A/c)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              placeholder="Bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
            <Input
              placeholder="Account number"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value)
              }
              required
            />
            <Input
              placeholder="IFSC (optional)"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Opening balance"
                value={openingBalance}
                onChange={(e) =>
                  setOpeningBalance(e.target.value)
                }
              />
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Accounts
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading...
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No bank accounts yet.
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b py-2 last:border-b-0"
              >
                <div>
                  <div className="font-medium">
                    {account.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {account.bankName} · {account.accountNumber}
                    {account.ifscCode
                      ? ` · ${account.ifscCode}`
                      : ""}{" "}
                    · Opening ₹
                    {account.openingBalance.toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={account.isActive}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({
                        id: account.id,
                        isActive: checked,
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {account.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
