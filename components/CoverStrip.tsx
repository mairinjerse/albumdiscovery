import covers from "@/data/covers.json";
import { spotifySearchUrl } from "@/lib/spotify";

interface Cover {
  artist: string;
  album: string;
  image: string | null;
  trend?: number[] | null;
  trendTag?: string | null;
}

const albums = covers as Cover[];

function trendSummary(trend: number[]): { pct: number; points: string } {
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  const span = max - min;
  const points = trend
    .map((v, i) => {
      const x = (i / (trend.length - 1)) * 100;
      const y = span === 0 ? 10 : 18 - ((v - min) / span) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const first = trend[0];
  const last = trend[trend.length - 1];
  const pct = first > 0 ? Math.round(((last - first) / first) * 100) : last > 0 ? 100 : 0;

  return { pct, points };
}

function Sparkline({ trend, tag }: { trend: number[]; tag: string }) {
  const { pct, points } = trendSummary(trend);
  const arrow = pct > 4 ? "▲" : pct < -4 ? "▼" : "→";

  return (
    <div
      className="flex h-full w-24 items-center gap-1 sm:w-32"
      title={`${tag} tag, 8-week trend ${pct >= 0 ? "+" : ""}${pct}%`}
    >
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full flex-1 stroke-moss">
        <polyline points={points} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="shrink-0 font-body text-[9px] tracking-wide text-paper/50">
        {arrow} {Math.abs(pct)}%
      </span>
    </div>
  );
}

function Tile({ artist, album, image, trend, trendTag }: Cover) {
  const hasTrend = !!trend && trend.length >= 2 && trend.some((v) => v > 0);

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
      <div className="mt-1 h-4">{hasTrend && <Sparkline trend={trend!} tag={trendTag ?? "similar"} />}</div>
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
