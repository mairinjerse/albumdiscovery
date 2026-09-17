// One-off script: derives an 8-week popularity trend for each album in
// data/covers.json from Last.fm's weekly tag charts, and rewrites that file
// in place. The site does not call this at request time — see CoverStrip.
//
// Last.fm has no direct "listeners over time" endpoint for an artist, so
// this uses the closest real signal it does expose: for the artist's top
// tag, tag.getweeklyartistchart gives that artist's playcount rank within
// the tag for a given week. Sampling the last 8 weeks produces a genuine,
// if approximate, trend line. An artist absent from a given week's top list
// (capped at `limit`) is recorded as 0 plays that week — an artifact of the
// chart size, not proof of zero plays.
//
// Usage: LASTFM_API_KEY=xxxx node scripts/fetch-trends.mjs
// Add --force to re-fetch entries that already have trend data (default
// behavior skips them, so re-running after adding new albums only hits
// Last.fm for the new/missing ones).

import { readFile, writeFile } from "node:fs/promises";

const apiKey = process.env.LASTFM_API_KEY;
if (!apiKey) {
  console.error("LASTFM_API_KEY is required");
  process.exit(1);
}

const force = process.argv.includes("--force");
const WEEKS = 8;
const CHART_LIMIT = 1000;

const path = new URL("../data/covers.json", import.meta.url);
const albums = JSON.parse(await readFile(path, "utf-8"));

async function call(params) {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  const res = await fetch(url);
  const data = await res.json();
  if (data?.error) throw new Error(data.message ?? `Last.fm error ${data.error}`);
  return data;
}

function normalize(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

async function topTag(artist) {
  const data = await call({ method: "artist.getTopTags", artist });
  const tags = data?.toptags?.tag ?? [];
  return tags[0]?.name ?? null;
}

async function weeklyChartRanges(tag) {
  const data = await call({ method: "tag.getWeeklyChartList", tag });
  const charts = data?.weeklychartlist?.chart ?? [];
  return charts.slice(-WEEKS);
}

async function weeklyPlaycount(tag, from, to, artist) {
  const data = await call({
    method: "tag.getWeeklyArtistChart",
    tag,
    from,
    to,
    limit: String(CHART_LIMIT),
  });
  const entries = data?.weeklyartistchart?.artist ?? [];
  const target = normalize(artist);
  const match = entries.find((e) => normalize(e.name ?? "") === target);
  return match ? Number(match.playcount) || 0 : 0;
}

async function fetchTrend(artist) {
  const tag = await topTag(artist);
  if (!tag) return null;
  await sleep();

  const ranges = await weeklyChartRanges(tag);
  await sleep();
  if (ranges.length < 2) return null;

  const trend = [];
  for (const { from, to } of ranges) {
    trend.push(await weeklyPlaycount(tag, from, to, artist));
    await sleep();
  }
  return { tag, trend };
}

function sleep() {
  // Last.fm's rate limit is roughly 5 req/s.
  return new Promise((r) => setTimeout(r, 220));
}

const out = [];
for (const entry of albums) {
  if (entry.trend && !force) {
    out.push(entry);
    continue;
  }
  process.stdout.write(`${entry.artist} - ${entry.album} ... `);
  try {
    const result = await fetchTrend(entry.artist);
    if (result) {
      console.log(`ok (tag: ${result.tag})`);
      out.push({ ...entry, trend: result.trend, trendTag: result.tag });
    } else {
      console.log("no tag/chart data");
      out.push({ ...entry, trend: null, trendTag: null });
    }
  } catch (err) {
    console.log(`failed (${err.message})`);
    out.push(entry);
  }
}

await writeFile(path, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${out.length} entries to ${path.pathname}`);
