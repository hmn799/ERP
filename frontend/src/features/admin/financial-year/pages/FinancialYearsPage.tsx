"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, LockOpen, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";

import { useFinancialYears } from "../hooks/useFinancialYears";
import FinancialYearDialog from "../components/FinancialYearDialog";
import ClosingBalancesDialog from "../components/ClosingBalancesDialog";

import FinancialYearService, {
  type FinancialYear,
} from "@/services/financial-year/financial-year.service";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN");
}

export default function FinancialYearsPage() {
  const { data = [], isLoading, refetch } = useFinancialYears();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<FinancialYear>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [viewTarget, setViewTarget] = useState<FinancialYear>();
  const [viewOpen, setViewOpen] = useState(false);

  async function handleConfirmClose() {
    if (!confirmTarget) return;

    try {
      setClosing(true);

      const updated = await FinancialYearService.close(confirmTarget.id);

      toast.success(
        `${updated.name} closed. ${updated.closingBalances?.length ?? 0} party balance(s) snapshotted.`,
      );

      setConfirmOpen(false);
      refetch();
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to close financial year.",
      );
    } finally {
      setClosing(false);
    }
  }

  async function handleReopen(fy: FinancialYear) {
    try {
      await FinancialYearService.reopen(fy.id);

      toast.success(`${fy.name} reopened.`);

      refetch();
    } catch (error) {
      console.error(error);

      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message;

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to reopen financial year.",
      );
    }
  }

  async function handleView(fy: FinancialYear) {
    const full = await FinancialYearService.get(fy.id);
    setViewTarget(full);
    setViewOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Financial Years</h1>
          <p className="text-sm text-muted-foreground">
            Closing a year blocks new transactions dated within it and
            snapshots every party's closing balance.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Financial Year
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-white">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Start Date</th>
              <th className="px-4 py-3 text-left">End Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {!isLoading && data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No financial years yet.
                </td>
              </tr>
            )}

            {data.map((fy) => (
              <tr key={fy.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{fy.name}</td>
                <td className="px-4 py-3">{formatDate(fy.startDate)}</td>
                <td className="px-4 py-3">{formatDate(fy.endDate)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      fy.isClosed
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {fy.isClosed ? "Closed" : "Open"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {fy.isClosed ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(fy)}
                        >
                          View Balances
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReopen(fy)}
                        >
                          <LockOpen className="mr-1.5 h-3.5 w-3.5" />
                          Reopen
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setConfirmTarget(fy);
                          setConfirmOpen(true);
                        }}
                      >
                        <Lock className="mr-1.5 h-3.5 w-3.5" />
                        Close Year
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FinancialYearDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <ClosingBalancesDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        financialYear={viewTarget}
      />

      <ERPDeleteDialog
        open={confirmOpen}
        title="Close Financial Year"
        description={`Close "${confirmTarget?.name}"? New transactions can no longer be dated within it, and every party's balance as of ${
          confirmTarget ? formatDate(confirmTarget.endDate) : ""
        } will be snapshotted. This can be undone with "Reopen".`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmClose}
        loading={closing}
      />
    </div>
  );
}
