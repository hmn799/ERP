"use client";

import { Button } from "@/components/ui/button";

interface Props {
  onSave(): void;
  onSaveAndNew(): void;
  onClear(): void;
  onCancel?: () => void;
  isEditMode?: boolean;
  saving?: boolean;
  cancelling?: boolean;
}

export default function PurchaseActions({
  onSave,
  onSaveAndNew,
  onClear,
  onCancel,
  isEditMode = false,
  saving = false,
  cancelling = false,
}: Props) {
  const disabled = saving || cancelling;

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-lg border bg-white p-3 shadow-sm">

      <div className="text-sm text-slate-500">
        {isEditMode
          ? "Editing purchase"
          : "New purchase"}
      </div>

      <div className="flex items-center gap-2">

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={disabled}
          className="min-w-[90px]"
        >
          Clear
        </Button>

        {!isEditMode && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveAndNew}
            disabled={disabled}
            className="min-w-[110px]"
          >
            Save &amp; New
          </Button>
        )}

        {isEditMode && onCancel && (
          <Button
            type="button"
            variant="destructive"
            onClick={onCancel}
            disabled={disabled}
            className="min-w-[130px]"
          >
            {cancelling
              ? "Cancelling..."
              : "Cancel Purchase"}
          </Button>
        )}

        <Button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className="min-w-[120px]"
        >
          {saving
            ? "Saving..."
            : isEditMode
              ? "Update Purchase"
              : "Save Purchase"}
        </Button>

      </div>
    </div>
  );
}
