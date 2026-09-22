# Album Discovery

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
# fill in ANTHROPIC_API_KEY (console.anthropic.com),
# LASTFM_API_KEY (last.fm/api/account/create — free, no user auth), and
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see Auth below)
npm run dev
```

## Auth, saved albums, and sharing

Signing in with Google lets you save a recommendation to "My library," add a
note, and generate a public share link (`/shared/[slug]`) that works without
signing in. This is backed by Supabase (Postgres + auth), with the OAuth
button, callback route, and library UI already wired up in the app — the
`google` provider and the database table are the only pieces that need to be
set up per-project:

1. **Create a Supabase project** (supabase.com) and copy its Project URL and
   anon public key (Project Settings > API) into `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`.
2. **Create the `saved_albums` table**: paste `supabase/schema.sql` into the
   Supabase SQL Editor and run it. It also sets up row-level security so
   users can only see/edit their own rows, while shared rows stay public.
3. **Create a Google OAuth client** in Google Cloud Console (APIs & Services
   > Credentials > Create Credentials > OAuth client ID > Web application).
   Add this authorized redirect URI:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
4. **Enable the Google provider in Supabase**: Authentication > Providers >
   Google, paste in the Client ID and Client Secret from step 3, and save.
5. **Allow your app's callback URL**: Authentication > URL Configuration,
   add `http://localhost:3000/auth/callback` for local dev and your
   production domain's `/auth/callback` once deployed.

Without this setup the app still works fully for anonymous recommendations —
"Sign in with Google" and "Save" will just error until it's configured.

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
- Supabase for auth (Google OAuth) and Postgres storage of saved albums
- `ANTHROPIC_API_KEY` and `LASTFM_API_KEY` are server-side only; the Supabase
  URL and anon key are safe to expose to the browser (access is enforced by
  row-level security, not by keeping them secret)
