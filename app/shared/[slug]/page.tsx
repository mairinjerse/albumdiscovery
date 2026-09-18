import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SharedAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: album } = await supabase
    .from("saved_albums")
    .select("*")
    .eq("share_slug", slug)
    .single();

  if (!album) notFound();

  return (
    <main className="min-h-screen bg-ink px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <Link href="/" className="text-xs text-paper/50 underline-offset-4 hover:underline">
          Album Discovery
        </Link>

        <article className="flex flex-col overflow-hidden rounded-md border border-paper/10 bg-paper/[0.03] sm:flex-row">
          <div className="aspect-square w-full shrink-0 overflow-hidden bg-black/30 sm:h-full sm:w-56">
            {album.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.image}
                alt={`${album.album} by ${album.artist}`}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4 p-6">
            <div>
              <h1 className="font-display text-3xl leading-tight text-paper">{album.artist}</h1>
              <p className="font-display text-lg italic leading-tight text-paper/60">
                {album.album}
              </p>
            </div>

            {album.reason && (
              <blockquote className="border-l-2 border-ember pl-4 text-base leading-relaxed text-paper">
                {album.reason}
              </blockquote>
            )}

            {album.note && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-paper/40">
                  Note
                </p>
                <p className="text-sm leading-relaxed text-paper/70">{album.note}</p>
              </div>
            )}

            {album.spotify_url && (
              <a
                href={album.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto w-fit shrink-0 rounded-full border border-ember/60 px-4 py-1.5 text-xs font-medium text-ember transition hover:bg-ember hover:text-ink"
              >
                Open in Spotify
              </a>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
