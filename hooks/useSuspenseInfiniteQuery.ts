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
      query = query.limit(pageSize + 1);

      const { data, error } = await query;

      if (error) throw error;

      const rawData = data == null ? [] : data;

      // Check if there are more items
      const hasMore = rawData.length > pageSize;
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
    { deep: true }
  ) as TData[];

  return {
    data,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
