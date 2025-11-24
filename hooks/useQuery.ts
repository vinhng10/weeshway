import { useAuth } from "@/hooks/useAuth";
import {
  UseQueryOptions,
  UseQueryResult,
  useQuery as useTanstackQuery,
} from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";

type EnabledOption = boolean | (() => boolean);

type AuthenticatedQueryOptions<TData, TError> = Omit<
  UseQueryOptions<TData, TError>,
  "enabled" | "queryFn"
> & {
  queryFn: () => Promise<unknown>;
  enabled?: EnabledOption;
};

export function useQuery<TData = unknown, TError = Error>(
  options: AuthenticatedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  // IMPORTANT: use separate selectors to avoid infinite loop
  const profile = useAuth((s) => s.profile);
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  const baseEnabled = isLoggedIn && !!profile;

  const finalEnabled =
    baseEnabled &&
    (typeof options.enabled === "function"
      ? options.enabled()
      : options.enabled ?? true);

  const wrappedQueryFn = async () => {
    const raw = await options.queryFn();
    return raw == null
      ? (raw as TData)
      : (camelcaseKeys(raw, { deep: true }) as TData);
  };

  const { enabled: _ignoreEnabled, queryFn: _ignoreQueryFn, ...rest } = options;

  return useTanstackQuery<TData, TError>({
    ...rest,
    enabled: finalEnabled,
    queryFn: wrappedQueryFn,
  });
}
