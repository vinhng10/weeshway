import { z } from "zod";
import {
  clearAppleMusicTokenCache,
  getAppleMusicToken,
} from "../_shared/apple-music.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { handleError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";

const APPLE_MUSIC_API = "https://api.music.apple.com/v1/catalog";

const requestSchema = z.object({
  term: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(25).default(25),
  storefront: z.string().length(2).toLowerCase().default("us"),
});

interface AppleMusicSong {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    artwork: { url: string };
    genreNames: string[];
    previews: Array<{ url: string }>;
  };
}

function mapSong(song: AppleMusicSong) {
  return {
    id: song.id,
    name: song.attributes.name,
    artistName: song.attributes.artistName,
    artworkUrl: song.attributes.artwork.url
      .replace("{w}", "100")
      .replace("{h}", "100"),
    genre: song.attributes.genreNames[0],
    previewUrl: song.attributes.previews[0]?.url ?? null,
    createdAt: new Date().toISOString(),
  };
}

async function searchSongs(
  term: string,
  limit: number,
  storefront: string,
  retry = true,
): Promise<ReturnType<typeof mapSong>[]> {
  const token = await getAppleMusicToken();
  const url = `${APPLE_MUSIC_API}/${storefront}/search?term=${encodeURIComponent(term)}&types=songs&limit=${limit}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && retry) {
    clearAppleMusicTokenCache();
    return searchSongs(term, limit, storefront, false);
  }

  if (!res.ok) throw new Error(`Apple Music API error: ${res.status}`);

  const data = await res.json();
  return (data.results?.songs?.data ?? []).map(mapSong);
}

Deno.serve(async (req) => {
  try {
    await authenticateRequest(req);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405);
    }

    const body = requestSchema.parse(await req.json());
    const songs = await searchSongs(body.term, body.limit, body.storefront);

    return jsonResponse({ songs });
  } catch (error: unknown) {
    const { message, status } = handleError("Apple Music API Error", error);
    return jsonResponse({ error: message }, status);
  }
});
