"use client";

import { Button } from "@/components/ui/button";

interface Props {
  onSave(): void;
  onSaveAndNew(): void;
  onClear(): void;
}

export default function PurchaseActions({
  onSave,
  onSaveAndNew,
  onClear,
}: Props) {
  return (
    <div className="flex justify-end gap-3">

      <Button
        type="button"
        variant="outline"
        onClick={onClear}
      >
        Clear
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={onSaveAndNew}
      >
        Save &amp; New
      </Button>

      <Button
        type="button"
        onClick={onSave}
      >
        Save Purchase
      </Button>

    </div>
  );
}