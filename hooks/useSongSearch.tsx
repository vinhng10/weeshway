import { DEBOUNCE_TIME } from "@/constants";
import { useLocales } from "@/hooks/useLocales";
import { supabase } from "@/supabase";
import { SongType } from "@/types";
import { useEffect, useState } from "react";

interface SongSearchState {
  songs: SongType[];
  loading: boolean;
  error: string | null;
}

export const useSongSearch = (query: string): SongSearchState => {
  const country = useLocales((s) => s.country);
  const [state, setState] = useState<SongSearchState>({
    songs: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState({ songs: [], loading: false, error: null });
      return;
    }

    const abortController = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          songs: SongType[];
        }>("apple-music", {
          body: { term: trimmed, storefront: country.toLowerCase() },
        });

        if (abortController.signal.aborted) return;
        if (error) throw error;

        setState({ songs: data?.songs ?? [], loading: false, error: null });
      } catch {
        if (!abortController.signal.aborted) {
          setState({
            songs: [],
            loading: false,
            error: "Couldn't search songs. Please try again.",
          });
        }
      }
    }, DEBOUNCE_TIME);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query, country]);

  return state;
};
