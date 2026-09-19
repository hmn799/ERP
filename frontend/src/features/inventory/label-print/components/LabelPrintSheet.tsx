"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import BarcodeSvg from "@/components/erp/print/BarcodeSvg";

export interface LabelQueueItem {
  id: string;
  itemCode: string;
  name: string;
  barcode: string;
  price: number;
  copies: number;
}

interface LabelPrintSheetProps {
  items: LabelQueueItem[];
}

/*
 * Portals a 40mm x 25mm label per copy onto <body>, same technique
 * as SalesReceiptPrint - see the shared .label-print-portal /
 * .receipt-print-portal rules in globals.css for why this has to be
 * a sibling of the whole app shell rather than nested inside it.
 */
export default function LabelPrintSheet({
  items,
}: LabelPrintSheetProps) {
  /*
   * Mounted only after the client's first render, so this component
   * returns null on both the server render AND the client's initial
   * hydration pass - only diverging (into the real portal) once
   * hydration has already completed and a mismatch can no longer
   * happen. Checking `typeof document` alone isn't enough: it's
   * already defined during the client's *first* render too (that
   * render still has to match what the server produced).
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const labels = items.flatMap((item) =>
    Array.from({ length: Math.max(item.copies, 0) }, (_, i) => ({
      ...item,
      key: `${item.id}-${i}`,
    })),
  );

  return createPortal(
    <div className="label-print-portal">
      {labels.map((label) => (
        <div key={label.key} className="label-40x25">
          <div className="label-name">{label.name}</div>

          <div className="label-barcode">
            <BarcodeSvg value={label.barcode} height={22} />
          </div>

          <div className="label-code-text">{label.barcode}</div>

          <div className="label-price">
            &#8377;{label.price.toFixed(2)}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
