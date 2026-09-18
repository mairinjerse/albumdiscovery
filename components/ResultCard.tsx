"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VerifiedResult } from "@/lib/types";
import { useAuth } from "./AuthProvider";

const TIER_LABEL: Record<VerifiedResult["tier"], string> = {
  household: "household name",
  well_known: "well known",
  growing: "growing",
  under_radar: "under the radar",
  obscure: "genuinely obscure",
};

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ResultCard({ result }: { result: VerifiedResult }) {
  const hue = Math.abs(hash(result.artist + result.album)) % 360;
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleSave() {
    if (!user || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");

    const supabase = createClient();
    const { error } = await supabase.from("saved_albums").insert({
      user_id: user.id,
      artist: result.artist,
      album: result.album,
      reason: result.reason,
      history: result.history,
      image: result.image,
      tier: result.tier,
      spotify_url: result.spotifyUrl,
    });

    setSaveState(error ? "error" : "saved");
  }

  const saveLabel = {
    idle: user ? "Save" : "Sign in to save",
    saving: "Saving…",
    saved: "Saved",
    error: "Couldn't save — retry",
  }[saveState];

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-paper/10 bg-paper/[0.03] transition hover:border-paper/25 sm:flex-row">
      <div className="aspect-square w-full shrink-0 overflow-hidden bg-ink sm:h-full sm:w-48">
        {result.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image}
            alt={`${result.album} by ${result.artist}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-end p-4"
            style={{
              background: `linear-gradient(160deg, hsl(${hue} 35% 20%), hsl(${hue} 30% 8%))`,
            }}
          >
            <span className="font-display text-lg italic text-paper/70">{result.artist}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="font-display text-2xl leading-tight text-paper">{result.artist}</h3>
          <p className="font-display text-base italic leading-tight text-paper/60">{result.album}</p>
        </div>

        <blockquote className="border-l-2 border-ember pl-4 text-base leading-relaxed text-paper">
          {result.reason}
        </blockquote>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-paper/40">The story</p>
          <p className="text-sm leading-relaxed text-paper/70">{result.history}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-xs uppercase tracking-wide text-paper/40">
            {TIER_LABEL[result.tier]}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!user || saveState === "saving" || saveState === "saved"}
              title={user ? undefined : "Sign in to save this album"}
              className="rounded-full border border-paper/20 px-4 py-1.5 text-xs font-medium text-paper/80 transition hover:border-paper/40 hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveLabel}
            </button>
            <a
              href={result.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ember/60 px-4 py-1.5 text-xs font-medium text-ember transition hover:bg-ember hover:text-ink"
            >
              Open in Spotify
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
