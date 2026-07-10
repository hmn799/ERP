"use client";

import ERPDataTable from "@/components/erp/crud/ERPDataTable";

import { GstSlab } from "../types/gst-slab.types";
import { getGstSlabColumns } from "./GstSlabColumns";

interface GstSlabTableProps {
  data: GstSlab[];

  loading?: boolean;

  onEdit(gstSlab: GstSlab): void;

  onDelete(gstSlab: GstSlab): void;
}

export default function GstSlabTable({
  data,
  onEdit,
  onDelete,
}: GstSlabTableProps) {
  return (
    <ERPDataTable
      columns={getGstSlabColumns({
        onEdit,
        onDelete,
      })}
      data={data}
    />
  );
}