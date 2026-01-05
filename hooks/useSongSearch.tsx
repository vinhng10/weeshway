import { DEBOUNCE_TIME } from "@/constants";
import { SongType } from "@/types";
import { useEffect, useState } from "react";

interface iTunesSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  previewUrl?: string;
  primaryGenreName?: string;
}

const mapITunesToSong = (result: iTunesSearchResult): SongType => ({
  id: result.trackId.toString(),
  name: result.trackName,
  artistName: result.artistName,
  artworkUrl: (result.artworkUrl100 || result.artworkUrl60 || "").replace(
    /\d+x\d+/g,
    "200x200"
  ),
  genreNames: result.primaryGenreName ? [result.primaryGenreName] : [],
  previewUrl: result.previewUrl,
  createdAt: new Date(),
});

export const useSongSearch = (query: string) => {
  const [state, setState] = useState({
    songs: [] as SongType[],
    loading: false,
    error: null as string | null,
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
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          trimmed
        )}&media=music&entity=song&limit=25`;
        const response = await fetch(url, { signal: abortController.signal });

        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();
        const mapped = data.results.map(mapITunesToSong);

        setState({ songs: mapped, loading: false, error: null });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setState({ songs: [], loading: false, error: err.message });
        }
      }
    }, DEBOUNCE_TIME);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  return state;
};
