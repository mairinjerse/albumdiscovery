export function spotifySearchUrl(artist: string, album: string): string {
  const query = encodeURIComponent(`${artist} ${album}`);
  return `https://open.spotify.com/search/${query}`;
}
