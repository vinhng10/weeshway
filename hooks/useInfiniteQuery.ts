"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { useInfiniteQuery as useTanStackInfiniteQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";

interface UseInfiniteQueryProps<TData = unknown> {
  tableName: string;
  columns?: string;
  pageSize?: number;
  queryKey: readonly unknown[];
  enabled?: boolean | (() => boolean);
  trailingQuery?: (query: any) => any;
}

export function useInfiniteQuery<TData = unknown>({
  tableName,
  columns = "*",
  pageSize = 10,
  queryKey,
  enabled = true,
  trailingQuery,
}: UseInfiniteQueryProps<TData>) {
  const profile = useAuth((s) => s.profile);
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  const baseEnabled = isLoggedIn && !!profile;

  const finalEnabled =
    baseEnabled &&
    (typeof enabled === "function" ? enabled() : enabled ?? true);

  const query = useTanStackInfiniteQuery({
    queryKey: queryKey,
    enabled: finalEnabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const skip = pageParam;

      let builder = supabase
        .from(tableName)
        .select(columns, { count: "exact" });

      if (trailingQuery) {
        builder = trailingQuery(builder);
      }

      const { data, count, error } = await builder.range(
        skip,
        skip + pageSize - 1
      );

      if (error) throw error;

      const transformedData =
        data == null ? [] : (camelcaseKeys(data, { deep: true }) as TData[]);

      return {
        data: transformedData,
        count: count || 0,
        nextSkip: (count || 0) > skip + pageSize ? skip + pageSize : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextSkip,
  });

  const data = (query.data?.pages.flatMap((page) => page.data) ||
    []) as TData[];
  const count = query.data?.pages[0]?.count || 0;

  return {
    data,
    count,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    hasNextPage: count > data.length,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
