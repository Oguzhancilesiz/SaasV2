"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { FilterState } from "@/components/filters/FilterToolbar";

export function useFilter(defaultItemsPerPage: number = 10) {
  const searchParams = useSearchParams();

  const filters: FilterState = useMemo(
    () => ({
      search: searchParams.get("q") ?? "",
      status: searchParams.get("status") ?? "all",
      sort: searchParams.get("sort") ?? "created_desc",
      page: Number(searchParams.get("page") ?? "1"),
    }),
    [searchParams]
  );

  const itemsPerPage = useMemo(
    () => Number(searchParams.get("perPage") ?? defaultItemsPerPage),
    [searchParams, defaultItemsPerPage]
  );

  return {
    filters,
    itemsPerPage,
  };
}

