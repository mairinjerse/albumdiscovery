"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { SavedAlbum } from "@/lib/types";

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [albums, setAlbums] = useState<SavedAlbum[] | null>(null);

  const loadAlbums = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("saved_albums")
      .select("*")
      .order("created_at", { ascending: false });
    setAlbums(data ?? []);
  }, [user]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  async function updateNote(id: string, note: string) {
    const supabase = createClient();
    await supabase.from("saved_albums").update({ note }).eq("id", id);
  }

  async function deleteAlbum(id: string) {
    const supabase = createClient();
    await supabase.from("saved_albums").delete().eq("id", id);
    setAlbums((prev) => prev?.filter((a) => a.id !== id) ?? null);
  }

  async function shareAlbum(album: SavedAlbum) {
    const supabase = createClient();
    let slug = album.share_slug;

    if (!slug) {
      slug = crypto.randomUUID();
      const { error } = await supabase
        .from("saved_albums")
        .update({ share_slug: slug })
        .eq("id", album.id);
      if (error) return;
      setAlbums((prev) =>
        prev?.map((a) => (a.id === album.id ? { ...a, share_slug: slug! } : a)) ?? null,
      );
    }

    await navigator.clipboard.writeText(`${window.location.origin}/shared/${slug}`);
  }

  if (authLoading) {
    return <main className="min-h-screen bg-ink" />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
        <p className="text-paper/70">Sign in to see albums you&rsquo;ve saved.</p>
        <AuthButton />
        <Link href="/" className="text-xs text-paper/40 underline-offset-4 hover:underline">
          Back to discovery
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-paper">My library</h1>
          <Link href="/" className="text-xs text-paper/50 underline-offset-4 hover:underline">
            Back to discovery
          </Link>
        </div>

        {albums === null ? (
          <p className="text-paper/50">Loading…</p>
        ) : albums.length === 0 ? (
          <p className="text-paper/50">
            Nothing saved yet &mdash; save an album from a recommendation.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {albums.map((album) => (
              <LibraryCard
                key={album.id}
                album={album}
                onNoteChange={(note) => updateNote(album.id, note)}
                onDelete={() => deleteAlbum(album.id)}
                onShare={() => shareAlbum(album)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LibraryCard({
  album,
  onNoteChange,
  onDelete,
  onShare,
}: {
  album: SavedAlbum;
  onNoteChange: (note: string) => void;
  onDelete: () => void;
  onShare: () => Promise<void>;
}) {
  const [note, setNote] = useState(album.note ?? "");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    await onShare();
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 2000);
  }

  return (
    <article className="flex flex-col gap-4 rounded-md border border-paper/10 bg-paper/[0.03] p-6 sm:flex-row">
      <div className="aspect-square w-full shrink-0 overflow-hidden rounded bg-black/30 sm:h-32 sm:w-32">
        {album.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.image}
            alt={`${album.album} by ${album.artist}`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div>
          <h3 className="font-display text-xl text-paper">{album.artist}</h3>
          <p className="font-display text-sm italic text-paper/60">{album.album}</p>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onNoteChange(note)}
          placeholder="Add a note…"
          rows={2}
          className="w-full rounded border border-paper/10 bg-black/20 p-2 text-sm text-paper placeholder:text-paper/30 focus:border-paper/30 focus:outline-none"
        />

        <div className="mt-auto flex items-center gap-3">
          <button
            onClick={handleShare}
            className="rounded-full border border-paper/20 px-4 py-1.5 text-xs font-medium text-paper/80 transition hover:border-paper/40 hover:text-paper"
          >
            {shareState === "copied" ? "Link copied" : "Copy share link"}
          </button>
          <button
            onClick={onDelete}
            className="rounded-full border border-paper/20 px-4 py-1.5 text-xs font-medium text-paper/50 transition hover:border-red-500/40 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
