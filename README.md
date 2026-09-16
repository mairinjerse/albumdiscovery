# Nobody You Know

Tell it what you're doing. It suggests artists you probably haven't heard,
each with a reason, and a link to open them in Spotify.

The recommender is Claude, not a collaborative-filtering model — the whole
point is a mechanism that works from context ("bath time with a toddler")
instead of taste history, and that explains itself. Last.fm verifies every
candidate is real and checks how well-known it actually is; Spotify is only
ever an exit link. See `ARCHITECTURE.md`-equivalent context in the original
design doc for the full reasoning.

## How it works

```
user answers → Claude proposes 8 candidates (artist + album + reason)
             → Last.fm confirms each exists and returns listener counts
             → results outside the requested familiarity tier are dropped
             → if fewer than 4 survive, one retry with feedback on what missed
             → Last.fm album art for the survivors
             → Spotify search link, no API/auth
```

That loop lives in `app/api/recommend/route.ts`, with the Claude call in
`lib/claude.ts` and the Last.fm calls in `lib/lastfm.ts`.

## Setup

```bash
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY (console.anthropic.com) and
# LASTFM_API_KEY (last.fm/api/account/create — free, no user auth)
npm run dev
```

## The cover strip

The drifting row of album covers at the top of the page is static — see
`data/covers.json`, a curated list of 40 (artist, album) pairs. Cover art
comes from Last.fm's `album.getInfo`, fetched once and committed rather than
requested on every page load. To (re)populate the images:

```bash
LASTFM_API_KEY=xxxx node scripts/fetch-covers.mjs
```

Entries with no `image` fall back to a generated gradient tile so the strip
never shows a broken image.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- One API route, no database, no auth, no saved results
- `ANTHROPIC_API_KEY` and `LASTFM_API_KEY` are server-side only
