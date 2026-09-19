"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import AlertsService, { type BusinessAlert } from "@/services/alerts/alerts.service";

const CATEGORY_LABEL: Record<BusinessAlert["category"], string> = {
  LOW_STOCK: "Low Stock",
  OVERDUE_RECEIVABLE: "Over Credit Limit",
  SCHEME_EXPIRY: "Scheme Expiring",
};

function timeAgo(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts = [], isFetching } = useQuery({
    queryKey: ["business-alerts"],
    queryFn: AlertsService.list,
    refetchInterval: 60000,
  });

  async function handleRefresh() {
    await AlertsService.generate();
    queryClient.invalidateQueries({ queryKey: ["business-alerts"] });
  }

  async function handleDismiss(id: string) {
    await AlertsService.acknowledge(id);
    queryClient.invalidateQueries({ queryKey: ["business-alerts"] });
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />

        {alerts.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 w-96 rounded-md border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-semibold">
                Alerts {alerts.length > 0 && `(${alerts.length})`}
              </span>

              <Button
                size="icon-sm"
                variant="ghost"
                disabled={isFetching}
                onClick={handleRefresh}
                title="Check for new alerts now"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {alerts.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No alerts right now.
                </div>
              )}

              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-2 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          alert.severity === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {CATEGORY_LABEL[alert.category] ?? alert.category}
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(alert.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm">{alert.message}</p>
                  </div>

                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleDismiss(alert.id)}
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
