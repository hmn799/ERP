"use client";

import { useQuery } from "@tanstack/react-query";

import subCategoryService from "@/services/sub-category/sub-category.service";

export function useSubCategories() {
  return useQuery({
    queryKey: ["sub-categories"],
    queryFn: subCategoryService.getAll,
  });
}