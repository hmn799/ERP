"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeSvgProps {
  value: string;
  height?: number;
}

export default function BarcodeSvg({
  value,
  height = 30,
}: BarcodeSvgProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;

    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: false,
        height,
        margin: 0,
      });
    } catch (error) {
      console.error("Failed to render barcode:", error);
    }
  }, [value, height]);

  if (!value) return null;

  return <svg ref={ref} />;
}
