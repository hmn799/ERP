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

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import BackupService, {
  BackupRun,
} from "@/services/backup/backup.service";

const PAGE_SIZE = 20;

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function statusVariant(status: BackupRun["status"]) {
  if (status === "SUCCESS") return "default" as const;
  if (status === "FAILED") return "destructive" as const;
  return "secondary" as const;
}

export default function BackupsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const [drillingId, setDrillingId] = useState<string | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["backups", page],
    queryFn: () => BackupService.list(page, PAGE_SIZE),
    refetchInterval: 5000,
  });

  const runMutation = useMutation({
    mutationFn: () => BackupService.run(),
    onSuccess: (run) => {
      if (run.status === "SUCCESS") {
        toast.success(
          `Backup created (${formatBytes(run.fileSizeBytes)}).`,
        );
      } else {
        toast.error(
          run.errorMessage || "Backup failed.",
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["backups"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to run backup.",
      );
    },
  });

  async function handleRestoreDrill(run: BackupRun) {
    setDrillingId(run.id);
    try {
      const result = await BackupService.restoreDrill(run.id);
      toast.success(
        `Restore drill passed - ${result.permissionCount} permissions, ${result.roleCount} roles restored.`,
      );
      queryClient.invalidateQueries({
        queryKey: ["backups"],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Restore drill failed.",
      );
    } finally {
      setDrillingId(null);
    }
  }

  async function handleDownload(run: BackupRun) {
    try {
      await BackupService.download(
        run.id,
        run.fileName || `backup-${run.id}.dump.enc`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to download backup.",
      );
    }
  }

  const columns: ColumnDef<BackupRun>[] = [
    {
      accessorKey: "startedAt",
      header: "Started",
      cell: ({ row }) =>
        new Date(row.original.startedAt).toLocaleString(
          "en-IN",
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "trigger",
      header: "Trigger",
    },
    {
      id: "size",
      header: "Size",
      cell: ({ row }) =>
        formatBytes(row.original.fileSizeBytes),
    },
    {
      id: "actor",
      header: "Triggered By",
      cell: ({ row }) =>
        row.original.actorName || "Scheduler",
    },
    {
      id: "verified",
      header: "Restore Verified",
      cell: ({ row }) =>
        row.original.restoreVerifiedAt ? (
          <Badge variant="outline">
            {new Date(
              row.original.restoreVerifiedAt,
            ).toLocaleDateString("en-IN")}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            Not verified
          </span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const run = row.original;
        const disabled =
          run.status !== "SUCCESS" || !run.fileName;

        return (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => handleDownload(run)}
            >
              Download
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || drillingId === run.id}
              onClick={() => handleRestoreDrill(run)}
            >
              {drillingId === run.id
                ? "Testing..."
                : "Restore Drill"}
            </Button>
          </div>
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
          <h1 className="text-2xl font-bold">Backups</h1>

          <p className="text-sm text-muted-foreground">
            Encrypted database backups with retention and
            restore verification. A daily backup also runs
            automatically.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
        >
          {runMutation.isPending
            ? "Running..."
            : "Run Backup Now"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Backup History
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ERPDataTable
            columns={columns}
            data={data?.items ?? []}
            loading={isLoading}
            emptyMessage="No backups have been run yet."
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data
                ? `${data.total} run${
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
