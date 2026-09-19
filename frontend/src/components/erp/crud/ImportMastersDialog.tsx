"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  csvRowsToObjects,
  downloadCsv,
  parseCsv,
} from "@/lib/csv";

import BulkImportService, {
  BulkImportResult,
  ImportEntity,
} from "@/services/bulk-import/bulk-import.service";

interface ImportMastersDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;

  title: string;
  entity: ImportEntity;

  /** Column headers, in order - also used for the downloadable template. */
  templateHeaders: string[];

  /** One example row shown in the template, same length/order as templateHeaders. */
  templateSample?: string[];

  /** Extra guidance shown above the file picker (allowed values, FK requirements, etc). */
  helpText?: string;

  onSuccess?(): void;
}

export default function ImportMastersDialog({
  open,
  onOpenChange,
  title,
  entity,
  templateHeaders,
  templateSample,
  helpText,
  onSuccess,
}: ImportMastersDialogProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<
    Record<string, string>[] | null
  >(null);

  const [importing, setImporting] = useState(false);
  const [result, setResult] =
    useState<BulkImportResult | null>(null);

  useEffect(() => {
    if (open) {
      setFileName("");
      setRows(null);
      setResult(null);
      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  function downloadTemplate() {
    downloadCsv(
      `${entity}-import-template`,
      templateSample ? [templateSample] : [],
      templateHeaders.map((header, index) => ({
        header,
        accessor: (row: string[]) =>
          row[index] ?? "",
      })),
    );
  }

  async function handleFile(
    file: File,
  ) {
    setFileName(file.name);
    setResult(null);

    const text = await file.text();
    const parsed = csvRowsToObjects(
      parseCsv(text),
    );

    if (parsed.length === 0) {
      toast.error(
        "No data rows found in that file.",
      );
      setRows(null);
      return;
    }

    setRows(parsed);
  }

  async function handleImport() {
    if (!rows) return;

    try {
      setImporting(true);

      const importResult =
        await BulkImportService.import(
          entity,
          rows,
        );

      setResult(importResult);

      if (importResult.successCount > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Import failed. Check the file and try again.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) =>
        !value && onOpenChange(false)
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
            <div className="text-muted-foreground">
              {helpText ??
                "Download the template, fill it in, then upload it here."}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={downloadTemplate}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Template
            </Button>
          </div>

          {!result && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                disabled={importing}
                onChange={(e) => {
                  const file =
                    e.target.files?.[0];

                  if (file) handleFile(file);
                }}
                className="block w-full text-sm"
              />

              {rows && (
                <div className="rounded-md border bg-gray-50 p-2 text-sm">
                  <span className="font-medium">
                    {fileName}
                  </span>{" "}
                  — {rows.length} row
                  {rows.length === 1 ? "" : "s"}{" "}
                  found.
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="rounded-md border bg-gray-50 p-3 text-sm">
                <span className="font-medium text-green-700">
                  {result.successCount} of{" "}
                  {result.total} imported
                  successfully.
                </span>

                {result.errors.length > 0 && (
                  <span className="text-red-600">
                    {" "}
                    {result.errors.length} row
                    {result.errors.length === 1
                      ? ""
                      : "s"}{" "}
                    failed.
                  </span>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
                  {result.errors.map((error) => (
                    <div
                      key={error.row}
                      className="text-red-600"
                    >
                      Row {error.row}:{" "}
                      {error.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={importing}
            onClick={() => onOpenChange(false)}
          >
            {result ? "Close" : "Cancel"}
          </Button>

          {!result && (
            <Button
              disabled={!rows || importing}
              onClick={handleImport}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              {importing
                ? "Importing..."
                : `Import${
                    rows
                      ? ` ${rows.length} Row${
                          rows.length === 1
                            ? ""
                            : "s"
                        }`
                      : ""
                  }`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
