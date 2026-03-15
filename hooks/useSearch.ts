import { DEBOUNCE_TIME, PAGE_SIZE } from "@/constants";
import { supabase } from "@/supabase";
import { SearchResultType } from "@/types";
import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { useEffect, useState } from "react";

interface SearchPage {
  data: SearchResultType[];
  nextOffset?: number;
}

interface SearchState {
  data: SearchResultType[];
  loading: boolean;
  error: string | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isDebouncing: boolean;
}

const useDebouncedValue = (value: string, delay = DEBOUNCE_TIME) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

export const useSearch = (query: string, rpc: string): SearchState => {
  const debouncedQuery = useDebouncedValue(query);
  const trimmed = debouncedQuery.trim();

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<
    SearchPage,
    Error,
    InfiniteData<SearchPage>,
    readonly unknown[],
    number
  >({
    queryKey: [rpc, trimmed],
    initialPageParam: 0,
    enabled: !!trimmed,
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await supabase
        .rpc(rpc, {
          p_search_term: trimmed,
          p_limit: PAGE_SIZE + 1,
          p_offset: pageParam,
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

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isDebouncing,
  };
};
