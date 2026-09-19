"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import batchService, {
  Batch,
} from "@/services/batch/batch.service";

interface ManageBatchBarcodesDialogProps {
  batchId: string | null;

  onOpenChange(open: boolean): void;
}

function errorMessage(error: unknown, fallback: string) {
  const message = (
    error as {
      response?: { data?: { message?: string | string[] } };
    }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message[0] ?? fallback;
  return message ?? fallback;
}

export default function ManageBatchBarcodesDialog({
  batchId,
  onOpenChange,
}: ManageBatchBarcodesDialogProps) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [newBarcode, setNewBarcode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!batchId) {
      setBatch(null);
      return;
    }

    setLoading(true);

    batchService
      .get(batchId)
      .then(setBatch)
      .catch(() => toast.error("Failed to load batch barcodes."))
      .finally(() => setLoading(false));
  }, [batchId]);

  async function refresh() {
    if (!batchId) return;
    setBatch(await batchService.get(batchId));
  }

  async function handleAdd() {
    if (!batchId || !newBarcode.trim()) return;

    try {
      setSaving(true);
      await batchService.addBarcode(batchId, newBarcode.trim());
      setNewBarcode("");
      await refresh();
      toast.success("Barcode added.");
    } catch (error) {
      toast.error(errorMessage(error, "Failed to add barcode."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(barcodeId: string) {
    if (!batchId) return;

    try {
      setSaving(true);
      await batchService.removeBarcode(batchId, barcodeId);
      await refresh();
      toast.success("Barcode removed.");
    } catch (error) {
      toast.error(errorMessage(error, "Failed to remove barcode."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPrimary(barcodeId: string) {
    if (!batchId) return;

    try {
      setSaving(true);
      await batchService.setPrimaryBarcode(batchId, barcodeId);
      await refresh();
      toast.success("Primary barcode updated.");
    } catch (error) {
      toast.error(
        errorMessage(error, "Failed to set primary barcode."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={!!batchId}
      onOpenChange={(value) => !value && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Manage Barcodes{batch ? ` — Batch ${batch.batchNo}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading...
            </div>
          )}

          {!loading && batch && (
            <>
              <div className="space-y-2">
                {batch.barcodes.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No barcodes recorded for this batch yet.
                  </div>
                )}

                {batch.barcodes.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {b.barcode}
                      </span>

                      {b.isPrimary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!b.isPrimary && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => handleSetPrimary(b.id)}
                        >
                          Make Primary
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={saving}
                        onClick={() => handleRemove(b.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <Input
                  value={newBarcode}
                  placeholder="Scan or type a new barcode"
                  disabled={saving}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                />

                <Button
                  disabled={saving || !newBarcode.trim()}
                  onClick={handleAdd}
                >
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
