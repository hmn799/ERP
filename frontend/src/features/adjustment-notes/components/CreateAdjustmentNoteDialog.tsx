"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import AdjustmentNoteService, {
  AdjustmentNoteType,
  CreateAdjustmentNoteItemDto,
} from "@/services/adjustment-note/adjustment-note.service";
import { CustomerService } from "@/services/customer/customer.service";
import SupplierService from "@/services/supplier/supplier.service";

interface CreateAdjustmentNoteDialogProps {
  open: boolean;
  noteType: AdjustmentNoteType;
  onOpenChange(open: boolean): void;
  onSuccess(): void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function blankLine(): CreateAdjustmentNoteItemDto {
  return {
    description: "",
    hsnCode: "",
    taxableAmount: 0,
    gstPercent: 0,
  };
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

export default function CreateAdjustmentNoteDialog({
  open,
  noteType,
  onOpenChange,
  onSuccess,
}: CreateAdjustmentNoteDialogProps) {
  const [noteDate, setNoteDate] = useState(todayDate());
  const [partyId, setPartyId] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<
    CreateAdjustmentNoteItemDto[]
  >([blankLine()]);
  const [saving, setSaving] = useState(false);

  const partyLabel =
    noteType === "DEBIT" ? "Supplier" : "Customer";

  const { data: customers = [] } = useQuery({
    queryKey: ["adjustment-notes", "customers"],
    queryFn: CustomerService.getAll,
    enabled: noteType === "CREDIT",
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["adjustment-notes", "suppliers"],
    queryFn: SupplierService.getAll,
    enabled: noteType === "DEBIT",
  });

  const parties =
    noteType === "DEBIT" ? suppliers : customers;

  useEffect(() => {
    if (open) {
      setNoteDate(todayDate());
      setPartyId("");
      setReason("");
      setLines([blankLine()]);
    }
  }, [open, noteType]);

  function updateLine(
    index: number,
    patch: Partial<CreateAdjustmentNoteItemDto>,
  ) {
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function addLine() {
    setLines((current) => [...current, blankLine()]);
  }

  function removeLine(index: number) {
    setLines((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index),
    );
  }

  const totals = lines.reduce(
    (acc, line) => {
      const taxable = Number(line.taxableAmount) || 0;
      const gst = Number(line.gstPercent) || 0;
      const gstAmount = (taxable * gst) / 100;

      acc.taxable += taxable;
      acc.tax += gstAmount;
      acc.net += taxable + gstAmount;

      return acc;
    },
    { taxable: 0, tax: 0, net: 0 },
  );

  async function handleSubmit() {
    if (!partyId) {
      toast.error(`Select a ${partyLabel.toLowerCase()}.`);
      return;
    }

    if (!reason.trim()) {
      toast.error("Enter a reason.");
      return;
    }

    const cleanLines = lines.filter(
      (line) =>
        line.description.trim() &&
        Number(line.taxableAmount) > 0,
    );

    if (cleanLines.length === 0) {
      toast.error(
        "Add at least one line with a description and amount.",
      );
      return;
    }

    try {
      setSaving(true);

      await AdjustmentNoteService.create({
        noteType,
        noteDate,
        partyId,
        reason: reason.trim(),
        items: cleanLines.map((line) => ({
          description: line.description.trim(),
          hsnCode: line.hsnCode?.trim() || undefined,
          taxableAmount: Number(line.taxableAmount),
          gstPercent: Number(line.gstPercent) || 0,
        })),
      });

      toast.success(
        `${noteType === "DEBIT" ? "Debit" : "Credit"} note created.`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        errorMessage(error, "Failed to create note."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !value && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            New {noteType === "DEBIT" ? "Debit" : "Credit"}{" "}
            Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Date</Label>
              <Input
                type="date"
                value={noteDate}
                disabled={saving}
                onChange={(e) =>
                  setNoteDate(e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label required>{partyLabel}</Label>
              <select
                value={partyId}
                disabled={saving}
                onChange={(e) =>
                  setPartyId(e.target.value)
                }
                className="w-full rounded border bg-white px-2 py-2 text-sm"
              >
                <option value="">
                  Select {partyLabel.toLowerCase()}...
                </option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>Reason</Label>
            <Textarea
              value={reason}
              disabled={saving}
              placeholder={
                noteType === "DEBIT"
                  ? "e.g. Rate difference on Bill #PB000123, discount agreed after billing..."
                  : "e.g. Discount given after invoicing, damaged goods compensation..."
              }
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={addLine}
              >
                + Add Line
              </Button>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <div className="grid grid-cols-[1fr_6rem_5rem_6rem_2rem] gap-2 text-xs font-medium text-muted-foreground">
                <span>Description</span>
                <span>HSN</span>
                <span>GST %</span>
                <span>Taxable Amt</span>
                <span />
              </div>

              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_6rem_5rem_6rem_2rem] gap-2"
                >
                  <Input
                    value={line.description}
                    disabled={saving}
                    placeholder="Description"
                    onChange={(e) =>
                      updateLine(index, {
                        description: e.target.value,
                      })
                    }
                  />
                  <Input
                    value={line.hsnCode}
                    disabled={saving}
                    placeholder="HSN"
                    onChange={(e) =>
                      updateLine(index, {
                        hsnCode: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={line.gstPercent}
                    disabled={saving}
                    onChange={(e) =>
                      updateLine(index, {
                        gstPercent: Number(
                          e.target.value,
                        ),
                      })
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.taxableAmount}
                    disabled={saving}
                    onChange={(e) =>
                      updateLine(index, {
                        taxableAmount: Number(
                          e.target.value,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    disabled={saving || lines.length === 1}
                    onClick={() => removeLine(index)}
                    className="flex items-center justify-center rounded hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-6 text-sm">
              <span>
                Taxable:{" "}
                <span className="font-medium">
                  ₹{totals.taxable.toFixed(2)}
                </span>
              </span>
              <span>
                GST:{" "}
                <span className="font-medium">
                  ₹{totals.tax.toFixed(2)}
                </span>
              </span>
              <span>
                Net:{" "}
                <span className="font-semibold">
                  ₹{totals.net.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
