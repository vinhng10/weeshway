"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { useSuspenseInfiniteQuery as useTanStackSuspenseInfiniteQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";

interface UseSuspenseInfiniteQueryProps<TData = unknown> {
  tableName: string;
  columns?: string;
  pageSize?: number;
  queryKey: readonly unknown[];
  enabled?: boolean | (() => boolean);
  trailingQuery?: (query: any) => any;
}

export function useSuspenseInfiniteQuery<TData = unknown>({
  tableName,
  columns = "*",
  pageSize = 10,
  queryKey,
  trailingQuery,
}: UseSuspenseInfiniteQueryProps<TData>) {
  const profile = useAuth((s) => s.profile);
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  const query = useTanStackSuspenseInfiniteQuery({
    queryKey: queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!isLoggedIn || !profile) {
        throw new Error("Not Logged In");
      }

      const skip = pageParam;

      let query = supabase
        .from(tableName)
        .select(columns, { count: "exact" });

      if (trailingQuery) {
        query = trailingQuery(query);
      }

      const { data, count, error } = await query.range(
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
    hasNextPage: count > data.length,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
