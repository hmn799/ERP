"use client";

import { useQuery } from "@tanstack/react-query";

import gstSlabService from "@/services/gst-slab/gst-slab.service";

export function useGstSlabs() {
  return useQuery({
    queryKey: ["gst-slabs"],
    queryFn: gstSlabService.getAll,
  });
}