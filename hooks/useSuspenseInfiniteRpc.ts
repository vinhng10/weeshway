"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { useSuspenseInfiniteQuery as useTanStackSuspenseInfiniteQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";

interface UseSuspenseInfiniteRpcProps<TData = unknown> {
  rpcFunction: string;
  rpcParams?: Record<string, unknown>;
  columns?: string;
  pageSize?: number;
  queryKey: readonly unknown[];
  enabled?: boolean | (() => boolean);
  trailingQuery?: (query: any, rpcResult?: any) => any;
}

export function useSuspenseInfiniteRpc<TData = unknown>({
  rpcFunction,
  rpcParams = {},
  columns = "*",
  pageSize = 10,
  queryKey,
  trailingQuery,
}: UseSuspenseInfiniteRpcProps<TData>) {
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);

  const query = useTanStackSuspenseInfiniteQuery({
    queryKey: queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!isLoggedIn || !profile) {
        throw new Error("Not Logged In");
      }

      const skip = pageParam;

      // Call RPC function first
      let query = supabase
        .rpc(rpcFunction, rpcParams)
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
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
