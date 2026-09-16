"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import AuditService, {
  AuditLogEntry,
} from "@/services/audit/audit.service";

const PAGE_SIZE = 25;

function formatEntity(entry: AuditLogEntry) {
  if (!entry.entityId) return entry.entityType;
  return `${entry.entityType} · ${entry.entityId.slice(-8)}`;
}

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleString(
        "en-IN",
      ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.action}
      </Badge>
    ),
  },
  {
    id: "entity",
    header: "Entity",
    cell: ({ row }) => formatEntity(row.original),
  },
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) =>
      row.original.actorName ||
      row.original.actorId ||
      "System / Anonymous",
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.details
          ? JSON.stringify(row.original.details)
          : "—"}
      </span>
    ),
  },
];

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const { data: actions = [] } = useQuery({
    queryKey: ["audit-log", "actions"],
    queryFn: AuditService.actions,
  });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "audit-log",
      { page, entityType, action },
    ],
    queryFn: () =>
      AuditService.list({
        page,
        pageSize: PAGE_SIZE,
        entityType: entityType || undefined,
        action: action || undefined,
      }),
  });

  const totalPages = data
    ? Math.max(
        1,
        Math.ceil(data.total / PAGE_SIZE),
      )
    : 1;

  const forbidden =
    isError &&
    (error as any)?.response?.status === 403;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Audit Log
        </h1>

        <p className="text-sm text-muted-foreground">
          Immutable record of rate overrides, discounts,
          bill edits, party price changes, and
          cancellations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Filters
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Entity type (e.g. SalesBill)"
            value={entityType}
            onChange={(e) => {
              setPage(1);
              setEntityType(e.target.value);
            }}
            className="max-w-56"
          />

          <Select
            value={action || "__all__"}
            onValueChange={(value) => {
              setPage(1);
              setAction(
                value === "__all__" ? "" : value,
              );
            }}
          >
            <SelectTrigger className="max-w-56">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="__all__">
                All actions
              </SelectItem>

              {actions.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {forbidden ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          You do not have permission to view the audit
          log.
        </div>
      ) : (
        <>
          <ERPDataTable
            columns={columns}
            data={data?.items ?? []}
            loading={isLoading}
            emptyMessage="No audit events found."
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data
                ? `${data.total} event${
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
        </>
      )}
    </div>
  );
}
