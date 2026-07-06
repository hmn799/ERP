"use client";

import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface ERPFormDialogProps {
  open: boolean;
  title: string;

  loading?: boolean;

  children: ReactNode;

  onClose(): void;

  onSubmit(): void;
}

export default function ERPFormDialog({
  open,
  title,

  loading = false,

  children,

  onClose,

  onSubmit,
}: ERPFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !value && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {children}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            disabled={loading}
            onClick={onSubmit}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}