import { useAuth } from "@/hooks/useAuth";
import {
  UseQueryOptions,
  UseSuspenseQueryResult,
  useSuspenseQuery as useTanStackSuspenseQuery,
} from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";

type AuthenticatedQueryOptions<TData, TError> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
> & {
  queryFn: () => Promise<TData>;
};

export function useSuspenseQuery<TData = unknown, TError = Error>(
  options: AuthenticatedQueryOptions<TData, TError>
): UseSuspenseQueryResult<TData, TError> {
  const profile = useAuth((s) => s.profile);
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  const wrappedQueryFn = async () => {
    if (!isLoggedIn || !profile) {
      throw new Error("Not Logged In");
    }

    const raw = await options.queryFn();
    return raw == null
      ? (raw as TData)
      : (camelcaseKeys(raw, { deep: true }) as TData);
  };

  return useTanStackSuspenseQuery<TData, TError>({
    ...options,
    queryFn: wrappedQueryFn,
  });
}
