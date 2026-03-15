import { PAGE_SIZE } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { useSuspenseInfiniteQuery as useTanStackSuspenseInfiniteQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";

interface UseSuspenseInfiniteQueryProps<TData = unknown> {
  tableName: string;
  columns?: string;
  queryKey: readonly unknown[];
  trailingQuery?: (query: any) => any;
}

interface UseSuspenseInfiniteQueryReturn<TData> {
  data: TData[];
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
}

export const useSuspenseInfiniteQuery = <TData = unknown>({
  tableName,
  columns = "*",
  queryKey,
  trailingQuery,
}: UseSuspenseInfiniteQueryProps<TData>): UseSuspenseInfiniteQueryReturn<TData> => {
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);

  const query = useTanStackSuspenseInfiniteQuery({
    queryKey: [...queryKey, profile?.id],
    initialPageParam: undefined as string | number | undefined,
    queryFn: async ({ pageParam }) => {
      if (!isLoggedIn || !profile) {
        throw new Error("Not Logged In");
      }

      let query = supabase
        .from(tableName)
        .select(columns)
        .order("id", { ascending: false });

      // Apply cursor filter if we have a pageParam
      if (pageParam !== undefined) {
        query = query.lt("id", pageParam);
      }

      // Apply any additional filters/queries
      if (trailingQuery) {
        query = trailingQuery(query);
      }

      // Fetch one extra item to check if there's more data
      query = query.limit(PAGE_SIZE + 1);

      const { data } = await query.throwOnError();

      const rawData = data == null ? [] : data;

      // Check if there are more items
      const hasMore = rawData.length > PAGE_SIZE;
      const items = hasMore ? rawData.slice(0, -1) : rawData;

      // Get the cursor for the next page (using original field name)
      const nextCursor =
        hasMore && items.length > 0
          ? (items[items.length - 1] as any).id
          : undefined;

      return { data: items, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const data = camelcaseKeys(
    query.data?.pages.flatMap((page) => page.data) || [],
    { deep: true },
  ) as TData[];

  return {
    data,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};
