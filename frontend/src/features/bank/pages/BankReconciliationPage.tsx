"use client";

import { useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import BankAccountService from "@/services/bank/bank-account.service";
import BankReconciliationService, {
  BankTransaction,
  ImportRow,
} from "@/services/bank/bank-reconciliation.service";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/*
 * Minimal CSV parser for the documented statement format:
 * Date,Description,Reference,Debit,Credit. Does not handle quoted
 * commas - good enough for a plain bank-statement export.
 */
function parseCsv(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const [header, ...rows] = lines;
  const isHeader = /date/i.test(header);
  const dataRows = isHeader ? rows : lines;

  return dataRows
    .map((line) => {
      const [date, description, reference, debit, credit] =
        line.split(",").map((cell) => cell.trim());

      return {
        transactionDate: date
          ? new Date(date).toISOString()
          : "",
        description: description || "(no description)",
        referenceNo: reference || undefined,
        debitAmount: debit ? Number(debit) : undefined,
        creditAmount: credit ? Number(credit) : undefined,
      };
    })
    .filter(
      (row) =>
        row.transactionDate &&
        ((row.debitAmount ?? 0) > 0 ||
          (row.creditAmount ?? 0) > 0),
    );
}

function statusVariant(status: string) {
  if (status === "MATCHED") return "default" as const;
  if (status === "IGNORED") return "secondary" as const;
  return "outline" as const;
}

function SuggestionsPanel({
  bankTransactionId,
  onMatched,
}: {
  bankTransactionId: string;
  onMatched(): void;
}) {
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["bank-suggestions", bankTransactionId],
    queryFn: () =>
      BankReconciliationService.suggestions(
        bankTransactionId,
      ),
  });

  const matchMutation = useMutation({
    mutationFn: (ledgerEntryId: string) =>
      BankReconciliationService.confirmMatch(
        bankTransactionId,
        ledgerEntryId,
      ),
    onSuccess: () => {
      toast.success("Matched.");
      onMatched();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to confirm match.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        Looking for candidates...
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        No matching receipt/payment found within 5 days for
        this amount.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      {suggestions.map((s) => (
        <div
          key={s.ledgerEntryId}
          className="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <span>
            {new Date(s.transactionDate).toLocaleDateString(
              "en-IN",
            )}{" "}
            · {s.partyName} · ₹{money(s.amount)} ·{" "}
            {s.daysApart === 0
              ? "same day"
              : `${s.daysApart}d apart`}
          </span>

          <Button
            type="button"
            size="sm"
            disabled={matchMutation.isPending}
            onClick={() =>
              matchMutation.mutate(s.ledgerEntryId)
            }
          >
            Confirm Match
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function BankReconciliationPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
  });

  const [bankAccountId, setBankAccountId] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "UNMATCHED" | "MATCHED" | "IGNORED"
  >("UNMATCHED");
  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );

  const activeAccountId =
    bankAccountId || accounts[0]?.id || "";

  const { data: summary } = useQuery({
    queryKey: ["bank-summary", activeAccountId],
    queryFn: () =>
      BankReconciliationService.summary(activeAccountId),
    enabled: !!activeAccountId,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: [
      "bank-transactions",
      activeAccountId,
      statusFilter,
    ],
    queryFn: () =>
      BankReconciliationService.listTransactions(
        activeAccountId,
        statusFilter || undefined,
      ),
    enabled: !!activeAccountId,
  });

  function invalidateAll() {
    queryClient.invalidateQueries({
      queryKey: ["bank-transactions"],
    });
    queryClient.invalidateQueries({
      queryKey: ["bank-summary"],
    });
    queryClient.invalidateQueries({
      queryKey: ["bank-suggestions"],
    });
  }

  const ignoreMutation = useMutation({
    mutationFn: (id: string) =>
      BankReconciliationService.ignore(id),
    onSuccess: () => {
      toast.success("Marked as ignored.");
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to ignore.",
      );
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: (id: string) =>
      BankReconciliationService.unmatch(id),
    onSuccess: () => {
      toast.success("Unmatched.");
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to unmatch.",
      );
    },
  });

  const importMutation = useMutation({
    mutationFn: (rows: ImportRow[]) =>
      BankReconciliationService.importTransactions(
        activeAccountId,
        rows,
      ),
    onSuccess: (result) => {
      toast.success(
        `Imported ${result.imported} statement line(s).`,
      );
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Import failed.",
      );
    },
  });

  function handleFileSelected(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    file.text().then((text) => {
      const rows = parseCsv(text);

      if (rows.length === 0) {
        toast.error(
          "No valid rows found. Expected columns: Date, Description, Reference, Debit, Credit.",
        );
        return;
      }

      importMutation.mutate(rows);
    });

    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bank Reconciliation
        </h1>
        <p className="text-sm text-muted-foreground">
          Match bank statement lines against bank-tagged
          receipts and payments.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Select
            value={activeAccountId}
            onValueChange={setBankAccountId}
          >
            <SelectTrigger className="max-w-72">
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} - {account.bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelected}
          />

          <Button
            type="button"
            variant="outline"
            disabled={
              !activeAccountId || importMutation.isPending
            }
            onClick={() => fileInputRef.current?.click()}
          >
            Import CSV
          </Button>

          <span className="text-xs text-muted-foreground">
            Expected columns: Date, Description, Reference,
            Debit, Credit
          </span>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Statement Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold">
              ₹{money(summary.statementBalance)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Book Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold">
              ₹{money(summary.bookBalance)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Difference
              </CardTitle>
            </CardHeader>
            <CardContent
              className={
                Math.abs(summary.difference) < 0.01
                  ? "text-xl font-bold text-emerald-600"
                  : "text-xl font-bold text-destructive"
              }
            >
              ₹{money(summary.difference)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Unmatched
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold">
              {summary.unmatchedCount}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Statement Lines
          </CardTitle>

          <Select
            value={statusFilter || "ALL"}
            onValueChange={(value) =>
              setStatusFilter(
                value === "ALL"
                  ? ""
                  : (value as
                      | "UNMATCHED"
                      | "MATCHED"
                      | "IGNORED"),
              )
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="UNMATCHED">
                Unmatched
              </SelectItem>
              <SelectItem value="MATCHED">Matched</SelectItem>
              <SelectItem value="IGNORED">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="space-y-2">
          {!activeAccountId ? (
            <div className="text-sm text-muted-foreground">
              Add a bank account first.
            </div>
          ) : isLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading...
            </div>
          ) : transactions?.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No transactions in this view.
            </div>
          ) : (
            transactions?.items.map((tx: BankTransaction) => (
              <div
                key={tx.id}
                className="border-b py-2 last:border-b-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {tx.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(
                        tx.transactionDate,
                      ).toLocaleDateString("en-IN")}
                      {tx.referenceNo
                        ? ` · ${tx.referenceNo}`
                        : ""}{" "}
                      ·{" "}
                      {tx.creditAmount > 0
                        ? `Credit ₹${money(tx.creditAmount)}`
                        : `Debit ₹${money(tx.debitAmount)}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(tx.status)}>
                      {tx.status}
                    </Badge>

                    {tx.status === "UNMATCHED" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedId((current) =>
                              current === tx.id
                                ? null
                                : tx.id,
                            )
                          }
                        >
                          {expandedId === tx.id
                            ? "Hide"
                            : "Find Match"}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={ignoreMutation.isPending}
                          onClick={() =>
                            ignoreMutation.mutate(tx.id)
                          }
                        >
                          Ignore
                        </Button>
                      </>
                    )}

                    {tx.status === "MATCHED" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={unmatchMutation.isPending}
                        onClick={() =>
                          unmatchMutation.mutate(tx.id)
                        }
                      >
                        Unmatch
                      </Button>
                    )}
                  </div>
                </div>

                {expandedId === tx.id && (
                  <div className="mt-2">
                    <SuggestionsPanel
                      bankTransactionId={tx.id}
                      onMatched={() => {
                        setExpandedId(null);
                        invalidateAll();
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Add a Statement Line Manually
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ManualEntryForm
            bankAccountId={activeAccountId}
            onAdded={invalidateAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ManualEntryForm({
  bankAccountId,
  onAdded,
}: {
  bankAccountId: string;
  onAdded(): void;
}) {
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [direction, setDirection] = useState<
    "credit" | "debit"
  >("credit");
  const [amount, setAmount] = useState("");

  const addMutation = useMutation({
    mutationFn: () =>
      BankReconciliationService.addTransaction({
        bankAccountId,
        transactionDate: new Date(date).toISOString(),
        description,
        referenceNo: referenceNo || undefined,
        creditAmount:
          direction === "credit"
            ? Number(amount)
            : undefined,
        debitAmount:
          direction === "debit" ? Number(amount) : undefined,
      }),
    onSuccess: () => {
      toast.success("Statement line added.");
      setDescription("");
      setReferenceNo("");
      setAmount("");
      onAdded();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to add statement line.",
      );
    },
  });

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!bankAccountId) return;
        addMutation.mutate();
      }}
    >
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="lg:col-span-2"
      />

      <Input
        placeholder="Reference (optional)"
        value={referenceNo}
        onChange={(e) => setReferenceNo(e.target.value)}
      />

      <Select
        value={direction}
        onValueChange={(value) =>
          setDirection(value as "credit" | "debit")
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="credit">Credit (in)</SelectItem>
          <SelectItem value="debit">Debit (out)</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={!bankAccountId || addMutation.isPending}
        >
          Add
        </Button>
      </div>
    </form>
  );
}
