"use client";

import { Button } from "@/components/ui/button";

interface Props {
  onClear(): void;

  onSave(): void;

  saving?: boolean;
}

export default function PurchaseReturnActions({
  onClear,
  onSave,
  saving = false,
}: Props) {
  return (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        disabled={saving}
      >
        Clear
      </Button>

      <Button
        type="button"
        onClick={onSave}
        disabled={saving}
      >
        {saving
          ? "Saving Return..."
          : "Save Return"}
      </Button>
    </div>
  );
}