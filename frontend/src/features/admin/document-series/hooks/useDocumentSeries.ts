"use client";

import { useQuery } from "@tanstack/react-query";

import documentSeriesService from "@/services/document-series/document-series.service";

export function useDocumentSeries() {
  return useQuery({
    queryKey: ["document-series"],
    queryFn: documentSeriesService.getAll,
  });
}
