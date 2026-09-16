import { NextResponse } from "next/server";
import { proposeCandidates } from "@/lib/claude";
import { getAlbumImage, getArtistListeners } from "@/lib/lastfm";
import { spotifySearchUrl } from "@/lib/spotify";
import { TIER_LABEL, TIERS_BY_FAMILIARITY, tierForListeners } from "@/lib/tiers";
import type { Candidate, RecommendInput, Tier, VerifiedResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 5;
const MIN_RESULTS_BEFORE_RETRY = 4;

async function verifyCandidates(
  candidates: Candidate[],
  acceptedTiers: Tier[],
  seenArtists: Set<string>
): Promise<{ matches: Omit<VerifiedResult, "image">[]; rejected: string[] }> {
  const matches: Omit<VerifiedResult, "image">[] = [];
  const rejected: string[] = [];

  for (const candidate of candidates) {
    const key = candidate.artist.trim().toLowerCase();
    if (!key || seenArtists.has(key)) continue;
    seenArtists.add(key);

    const listeners = await getArtistListeners(candidate.artist);
    if (listeners == null) {
      rejected.push(`${candidate.artist} doesn't exist on Last.fm`);
      continue;
    }

    const tier = tierForListeners(listeners);
    if (!acceptedTiers.includes(tier)) {
      rejected.push(`${candidate.artist} is ${TIER_LABEL[tier]} (${listeners.toLocaleString()} listeners)`);
      continue;
    }

    matches.push({
      ...candidate,
      listeners,
      tier,
      spotifyUrl: spotifySearchUrl(candidate.artist, candidate.album),
    });
  }

  return { matches, rejected };
}

export async function POST(req: Request) {
  let input: RecommendInput;
  try {
    input = (await req.json()) as RecommendInput;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!Array.isArray(input.activities) || input.activities.length === 0) {
    return NextResponse.json({ error: "Tell us what you're doing." }, { status: 400 });
  }
  if (!input.familiarity) {
    return NextResponse.json({ error: "Missing familiarity preference." }, { status: 400 });
  }

  const acceptedTiers = TIERS_BY_FAMILIARITY[input.familiarity] ?? TIERS_BY_FAMILIARITY.unknown;
  const seenArtists = new Set<string>();

  let candidates: Candidate[];
  try {
    candidates = await proposeCandidates(input);
  } catch (err) {
    console.error("Claude candidate proposal failed", err);
    return NextResponse.json({ error: "Couldn't reach the recommender. Try again." }, { status: 502 });
  }

  let { matches, rejected } = await verifyCandidates(candidates, acceptedTiers, seenArtists);

  if (matches.length < MIN_RESULTS_BEFORE_RETRY) {
    const feedback = rejected.length
      ? `These didn't fit: ${rejected.join("; ")}. Try different, real artists that land in the requested tier — go further in that direction, don't repeat these.`
      : "Almost nothing you proposed checked out. Try a different set of real artists.";

    try {
      const more = await proposeCandidates(input, feedback);
      const retry = await verifyCandidates(more, acceptedTiers, seenArtists);
      matches = [...matches, ...retry.matches];
    } catch (err) {
      console.error("Claude retry failed", err);
      // Fall through with whatever we already have from the first pass.
    }
  }

  const final = matches.slice(0, MAX_RESULTS);

  if (final.length === 0) {
    return NextResponse.json(
      { error: "Nothing came back that checked out. Try loosening the request." },
      { status: 502 }
    );
  }

  const results: VerifiedResult[] = await Promise.all(
    final.map(async (m) => ({
      ...m,
      image: await getAlbumImage(m.artist, m.album),
    }))
  );

  return NextResponse.json({ results });
}
