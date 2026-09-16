// One-off script: pulls Last.fm album cover art for the curated list in
// data/covers.json and rewrites that file in place. Run manually whenever
// the curated list changes — the site does not call this at request time.
//
// Usage: LASTFM_API_KEY=xxxx node scripts/fetch-covers.mjs

import { readFile, writeFile } from "node:fs/promises";

const apiKey = process.env.LASTFM_API_KEY;
if (!apiKey) {
  console.error("LASTFM_API_KEY is required");
  process.exit(1);
}

const path = new URL("../data/covers.json", import.meta.url);
const albums = JSON.parse(await readFile(path, "utf-8"));

async function fetchCover(artist, album) {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "album.getinfo");
  url.searchParams.set("artist", artist);
  url.searchParams.set("album", album);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  const data = await res.json();
  const images = data?.album?.image ?? [];
  const large = images.find((img) => img.size === "extralarge") ?? images.at(-1);
  const src = large?.["#text"];
  return src && src.length > 0 ? src : null;
}

const out = [];
for (const entry of albums) {
  process.stdout.write(`${entry.artist} - ${entry.album} ... `);
  try {
    const image = await fetchCover(entry.artist, entry.album);
    console.log(image ? "ok" : "no image");
    out.push({ ...entry, image });
  } catch (err) {
    console.log(`failed (${err.message})`);
    out.push(entry);
  }
  // Last.fm's rate limit is roughly 5 req/s.
  await new Promise((r) => setTimeout(r, 220));
}

await writeFile(path, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${out.length} entries to ${path.pathname}`);
