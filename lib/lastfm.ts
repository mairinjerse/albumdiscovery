const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

async function call(params: Record<string, string>): Promise<any> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("LASTFM_API_KEY is not set");

  const url = new URL(BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");

  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

/**
 * Returns the artist's Last.fm listener count, or null if Last.fm has
 * never heard of them (the existence check that catches hallucinations).
 */
export async function getArtistListeners(artist: string): Promise<number | null> {
  try {
    const data = await call({ method: "artist.getinfo", artist });
    if (data?.error) return null;
    const listeners = Number(data?.artist?.stats?.listeners);
    return Number.isFinite(listeners) ? listeners : null;
  } catch {
    return null;
  }
}

/**
 * Confirms the artist+album pair itself exists on Last.fm — an artist can be
 * real while Claude still invents an album title for them, and the artist-only
 * check doesn't catch that. Returns null if the album doesn't exist there.
 *
 * Last.fm artist images have been placeholder graphics for years — album
 * images are the ones worth trusting for the result cards.
 */
export async function getAlbumInfo(
  artist: string,
  album: string
): Promise<{ image: string | null } | null> {
  try {
    const data = await call({ method: "album.getinfo", artist, album });
    if (data?.error) return null;
    const images: Array<{ size: string; "#text": string }> = data?.album?.image ?? [];
    const large = images.find((img) => img.size === "extralarge") ?? images.at(-1);
    const src = large?.["#text"];
    return { image: src && src.length > 0 ? src : null };
  } catch {
    return null;
  }
}
