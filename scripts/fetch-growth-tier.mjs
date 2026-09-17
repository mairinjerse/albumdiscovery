// One-off script: pulls each album artist's current Last.fm listener count
// and classifies it into the same tier buckets lib/tiers.ts uses for the
// recommend flow, then rewrites data/covers.json in place. The site does
// not call this at request time — see CoverStrip.
//
// Earlier attempts at a true week-by-week trend used tag.getWeeklyArtistChart,
// which turned out to be a retired/restricted Last.fm method (confirmed live:
// it returns "Invalid Method" regardless of tag or date range). A live
// listener-count snapshot, classified into a tier, is the honest signal
// Last.fm's API actually supports today.
//
// Usage: LASTFM_API_KEY=xxxx node scripts/fetch-growth-tier.mjs
// Add --force to re-fetch entries that already have tier data (default
// behavior skips them, so re-running after adding new albums only hits
// Last.fm for the new/missing ones).

import { readFile, writeFile } from "node:fs/promises";

const apiKey = process.env.LASTFM_API_KEY;
if (!apiKey) {
  console.error("LASTFM_API_KEY is required");
  process.exit(1);
}

const force = process.argv.includes("--force");

const path = new URL("../data/covers.json", import.meta.url);
const albums = JSON.parse(await readFile(path, "utf-8"));

// Same thresholds as lib/tiers.ts's tierForListeners.
function tierForListeners(listeners) {
  if (listeners >= 2_000_000) return "household";
  if (listeners >= 500_000) return "well_known";
  if (listeners >= 50_000) return "growing";
  if (listeners >= 5_000) return "under_radar";
  return "obscure";
}

async function getListeners(artist) {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "artist.getinfo");
  url.searchParams.set("artist", artist);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  const data = await res.json();
  if (data?.error) throw new Error(data.message ?? `Last.fm error ${data.error}`);
  const listeners = Number(data?.artist?.stats?.listeners);
  return Number.isFinite(listeners) ? listeners : null;
}

const out = [];
for (const entry of albums) {
  if (entry.lastfmTier && !force) {
    out.push(entry);
    continue;
  }
  process.stdout.write(`${entry.artist} - ${entry.album} ... `);
  try {
    const listeners = await getListeners(entry.artist);
    if (listeners === null) {
      console.log("no listener data");
      out.push({ ...entry, lastfmTier: null, lastfmListeners: null });
    } else {
      const lastfmTier = tierForListeners(listeners);
      console.log(`ok (${listeners.toLocaleString()} listeners -> ${lastfmTier})`);
      out.push({ ...entry, lastfmTier, lastfmListeners: listeners });
    }
  } catch (err) {
    console.log(`failed (${err.message})`);
    out.push(entry);
  }
  // Last.fm's rate limit is roughly 5 req/s.
  await new Promise((r) => setTimeout(r, 220));
}

await writeFile(path, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${out.length} entries to ${path.pathname}`);
