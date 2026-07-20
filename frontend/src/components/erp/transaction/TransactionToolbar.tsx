"use client";

import { Input } from "@/components/ui/input";

interface Props {
  value: string;

  onChange(value: string): void;
}

export default function TransactionToolbar({
  value,
  onChange,
}: Props) {
  return (
    <div className="border-b p-4">

      <Input
        placeholder="Scan barcode or search item..."
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

    </div>
  );
}