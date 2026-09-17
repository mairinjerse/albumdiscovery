import covers from "@/data/covers.json";
import { spotifySearchUrl } from "@/lib/spotify";
import { TIER_LABEL } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

interface Cover {
  artist: string;
  album: string;
  image: string | null;
  lastfmTier?: Tier | null;
  lastfmListeners?: number | null;
}

const albums = covers as Cover[];

const TIER_ICON: Record<Tier, string> = {
  household: "★",
  well_known: "→",
  growing: "▲",
  under_radar: "△",
  obscure: "○",
};

const TIER_COLOR: Record<Tier, string> = {
  household: "text-ember",
  well_known: "text-paper/50",
  growing: "text-moss",
  under_radar: "text-moss/70",
  obscure: "text-paper/30",
};

function GrowthBadge({ tier, listeners }: { tier: Tier; listeners: number | null | undefined }) {
  const listenerText = listeners ? `${listeners.toLocaleString()} listeners on Last.fm` : "Last.fm";

  return (
    <div
      className={`flex h-full items-center gap-1 ${TIER_COLOR[tier]}`}
      title={`${TIER_LABEL[tier]} · ${listenerText}`}
    >
      <span className="text-xs leading-none">{TIER_ICON[tier]}</span>
      <span className="truncate font-body text-[9px] uppercase tracking-wide">{TIER_LABEL[tier]}</span>
    </div>
  );
}

function Tile({ artist, album, image, lastfmTier, lastfmListeners }: Cover) {
  const inner = image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={`${album} by ${artist}`}
      className="h-24 w-24 shrink-0 rounded-sm object-cover sm:h-32 sm:w-32"
      loading="lazy"
    />
  ) : (
    <div
      className="flex h-24 w-24 shrink-0 flex-col justify-end rounded-sm p-2 sm:h-32 sm:w-32"
      style={{
        background: `linear-gradient(160deg, hsl(${hue(artist + album)} 35% 18%), hsl(${hue(artist + album)} 30% 9%))`,
      }}
    >
      <span className="line-clamp-2 font-display text-[10px] italic leading-tight text-paper/70">
        {artist}
      </span>
    </div>
  );

  return (
    <a
      href={spotifySearchUrl(artist, album)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${artist} — ${album}`}
      className="flex shrink-0 flex-col transition hover:opacity-80"
    >
      {inner}
      <div className="mt-1 h-4 w-24 sm:w-32">
        {lastfmTier && <GrowthBadge tier={lastfmTier} listeners={lastfmListeners} />}
      </div>
    </a>
  );
}

function hue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

export default function CoverStrip() {
  const doubled = [...albums, ...albums];

  return (
    <div className="relative w-full overflow-hidden border-b border-paper/10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent sm:w-32" />
      <div className="flex w-max gap-2 py-3 animate-drift sm:gap-3 sm:py-4">
        {doubled.map((c, i) => (
          <Tile key={`${c.artist}-${c.album}-${i}`} {...c} />
        ))}
      </div>
    </div>
  );
}
