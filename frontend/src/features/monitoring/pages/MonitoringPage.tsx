"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import MonitoringService, {
  SystemAlert,
} from "@/services/monitoring/monitoring.service";

const PAGE_SIZE = 25;

const CATEGORIES = [
  "JOB_FAILURE",
  "BACKUP_FAILURE",
  "SLOW_QUERY",
  "TRANSACTION_ERROR",
  "RECONCILIATION_EXCEPTION",
];

function severityVariant(severity: string) {
  return severity === "CRITICAL"
    ? ("destructive" as const)
    : ("secondary" as const);
}

export default function MonitoringPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [acknowledged, setAcknowledged] = useState<
    "" | "true" | "false"
  >("false");

  const queryClient = useQueryClient();

  const { data: summary = [] } = useQuery({
    queryKey: ["monitoring", "summary"],
    queryFn: MonitoringService.summary,
    refetchInterval: 15000,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "monitoring",
      "alerts",
      { page, category, acknowledged },
    ],
    queryFn: () =>
      MonitoringService.listAlerts({
        page,
        pageSize: PAGE_SIZE,
        category: category || undefined,
        acknowledged: acknowledged || undefined,
      }),
    refetchInterval: 15000,
  });

  const reconciliationMutation = useMutation({
    mutationFn: () => MonitoringService.runReconciliation(),
    onSuccess: (result) => {
      if (result.exceptionCount === 0) {
        toast.success(
          "Reconciliation check passed - no exceptions found.",
        );
      } else {
        toast.error(
          `Reconciliation check found ${result.exceptionCount} exception(s).`,
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["monitoring"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Reconciliation check failed.",
      );
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) =>
      MonitoringService.acknowledge(id),
    onSuccess: () => {
      toast.success("Alert acknowledged.");
      queryClient.invalidateQueries({
        queryKey: ["monitoring"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to acknowledge alert.",
      );
    },
  });

  const criticalOpen = summary
    .filter((row) => row.severity === "CRITICAL")
    .reduce((sum, row) => sum + row.count, 0);

  const warningOpen = summary
    .filter((row) => row.severity === "WARNING")
    .reduce((sum, row) => sum + row.count, 0);

  const columns: ColumnDef<SystemAlert>[] = [
    {
      accessorKey: "createdAt",
      header: "When",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString(
          "en-IN",
        ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => (
        <Badge variant={severityVariant(row.original.severity)}>
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="max-w-md text-sm">
          {row.original.message}
        </span>
      ),
    },
    {
      id: "acknowledged",
      header: "Status",
      cell: ({ row }) => {
        const alert = row.original;

        if (alert.acknowledgedAt) {
          return (
            <span className="text-xs text-muted-foreground">
              Acknowledged by{" "}
              {alert.acknowledgedByName || "unknown"}
            </span>
          );
        }

        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={acknowledgeMutation.isPending}
            onClick={() =>
              acknowledgeMutation.mutate(alert.id)
            }
          >
            Acknowledge
          </Button>
        );
      },
    },
  ];

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>

          <p className="text-sm text-muted-foreground">
            Failed jobs, backup failures, slow reports,
            transaction errors, and stock/ledger
            reconciliation exceptions.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => reconciliationMutation.mutate()}
          disabled={reconciliationMutation.isPending}
        >
          {reconciliationMutation.isPending
            ? "Checking..."
            : "Run Reconciliation Check"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Open Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-destructive">
              {criticalOpen}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Open Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {warningOpen}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alerts</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={category || "__all__"}
              onValueChange={(value) => {
                setPage(1);
                setCategory(
                  value === "__all__" ? "" : value,
                );
              }}
            >
              <SelectTrigger className="max-w-56">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__all__">
                  All categories
                </SelectItem>

                {CATEGORIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={acknowledged || "__all__"}
              onValueChange={(value) => {
                setPage(1);
                setAcknowledged(
                  value === "__all__"
                    ? ""
                    : (value as "true" | "false"),
                );
              }}
            >
              <SelectTrigger className="max-w-56">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__all__">
                  All statuses
                </SelectItem>
                <SelectItem value="false">
                  Open only
                </SelectItem>
                <SelectItem value="true">
                  Acknowledged only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ERPDataTable
            columns={columns}
            data={data?.items ?? []}
            loading={isLoading}
            emptyMessage="No alerts found."
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data
                ? `${data.total} alert${
                    data.total === 1 ? "" : "s"
                  } · Page ${page} of ${totalPages}`
                : ""}
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => current + 1)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
