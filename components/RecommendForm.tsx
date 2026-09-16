"use client";

import { useState } from "react";
import type { Familiarity, VerifiedResult } from "@/lib/types";
import ResultCard from "./ResultCard";

const ACTIVITIES = [
  "driving",
  "making breakfast",
  "cleaning the house",
  "hanging with kids",
  "friends over",
  "on the water",
  "working",
];

const FAMILIARITY_OPTIONS: { value: Familiarity; label: string }[] = [
  { value: "mainstream", label: "Mainstream" },
  { value: "on_the_rise", label: "On the rise" },
  { value: "unknown", label: "Nobody you know" },
];

const LOADING_LINES = [
  "Thinking about what actually fits this...",
  "Digging through the crates...",
  "Checking these aren't made up...",
  "Almost there...",
];

export default function RecommendForm() {
  const [activities, setActivities] = useState<string[]>([]);
  const [vibe, setVibe] = useState("");
  const [familiarity, setFamiliarity] = useState<Familiarity>("on_the_rise");
  const [referenceAlbum, setReferenceAlbum] = useState("");
  const [genre, setGenre] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VerifiedResult[] | null>(null);

  function toggleActivity(a: string) {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activities.length === 0) {
      setError("Pick at least one thing you're doing.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    let lineIndex = 0;
    const lineTimer = setInterval(() => {
      lineIndex = Math.min(lineIndex + 1, LOADING_LINES.length - 1);
      setLoadingLine(LOADING_LINES[lineIndex]);
    }, 2200);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activities,
          vibe: vibe.trim() || undefined,
          familiarity,
          referenceAlbum: referenceAlbum.trim() || undefined,
          genre: genre.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
      } else {
        setResults(data.results);
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      clearInterval(lineTimer);
      setLoadingLine(LOADING_LINES[0]);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-10 sm:pt-16">
      <header className="mb-10 space-y-3 text-center">
        <h1 className="font-display text-4xl italic text-paper sm:text-5xl">Album Discovery</h1>
        <p className="mx-auto max-w-md text-sm text-paper/60">
          Tell it what you&apos;re doing. It sends you somewhere strange, with a reason attached —
          not another playlist built to keep you comfortable.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-paper/90">What are you doing?</legend>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => {
              const active = activities.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => toggleActivity(a)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-ember bg-ember text-ink"
                      : "border-paper/20 text-paper/70 hover:border-paper/40"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="vibe" className="mb-2 block text-sm font-medium text-paper/70">
            Anything else about the vibe? <span className="text-paper/40">(optional)</span>
          </label>
          <input
            id="vibe"
            type="text"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g. it's raining, everyone's a little tired, need something warm"
            className="w-full rounded-md border border-paper/20 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/30 focus:border-ember focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-paper/90">How known?</legend>
          <div className="flex flex-wrap gap-2">
            {FAMILIARITY_OPTIONS.map((opt) => {
              const active = familiarity === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setFamiliarity(opt.value)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-moss bg-moss text-paper"
                      : "border-paper/20 text-paper/70 hover:border-paper/40"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reference" className="mb-2 block text-sm font-medium text-paper/70">
              A reference album <span className="text-paper/40">(optional)</span>
            </label>
            <input
              id="reference"
              type="text"
              value={referenceAlbum}
              onChange={(e) => setReferenceAlbum(e.target.value)}
              placeholder="something you already like"
              className="w-full rounded-md border border-paper/20 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/30 focus:border-ember focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="genre" className="mb-2 block text-sm font-medium text-paper/70">
              Genre lean <span className="text-paper/40">(optional)</span>
            </label>
            <input
              id="genre"
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="jazz, ambient, guitar music..."
              className="w-full rounded-md border border-paper/20 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/30 focus:border-ember focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-ember">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ember py-3 text-sm font-medium text-ink transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? loadingLine : "Find me something"}
        </button>
      </form>

      {results && results.length > 0 && (
        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {results.map((r) => (
            <ResultCard key={`${r.artist}-${r.album}`} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}
