import { DEBOUNCE_TIME, PAGE_SIZE } from "@/constants";
import { supabase } from "@/supabase";
import { SearchResultType } from "@/types";
import {
  type InfiniteData,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

function useDebouncedValue(value: string, delay = DEBOUNCE_TIME) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query);
  const trimmed = debouncedQuery.trim();
  const profile = useAuth((state) => state.profile);

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery<
    { data: SearchResultType[]; nextOffset?: number },
    Error,
    InfiniteData<{ data: SearchResultType[]; nextOffset?: number }>,
    readonly unknown[],
    number
  >({
    queryKey: ["search", trimmed, profile?.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!trimmed) return { data: [], nextOffset: undefined };

      const { data } = await supabase
        .rpc("search", {
          search_term: trimmed,
          page_limit: PAGE_SIZE + 1,
          page_offset: pageParam,
        })
        .throwOnError();

      const raw = data ?? [];
      const hasMore = raw.length > PAGE_SIZE;
      const items = hasMore ? raw.slice(0, -1) : raw;

      return {
        data: camelcaseKeys(items, { deep: true }) as SearchResultType[],
        nextOffset: hasMore ? pageParam + PAGE_SIZE : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const isDebouncing = query !== debouncedQuery;
  const data: SearchResultType[] =
    pages?.pages.flatMap((page) => page.data) ?? [];

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, isDebouncing };
}
