import covers from "@/data/covers.json";

interface Cover {
  artist: string;
  album: string;
  image: string | null;
}

const albums = covers as Cover[];

function Tile({ artist, album, image }: Cover) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={`${album} by ${artist}`}
        title={`${artist} — ${album}`}
        className="h-24 w-24 shrink-0 rounded-sm object-cover sm:h-32 sm:w-32"
        loading="lazy"
      />
    );
  }

  const hue = Math.abs(hash(artist + album)) % 360;
  return (
    <div
      title={`${artist} — ${album}`}
      className="flex h-24 w-24 shrink-0 flex-col justify-end rounded-sm p-2 sm:h-32 sm:w-32"
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 35% 18%), hsl(${hue} 30% 9%))`,
      }}
    >
      <span className="line-clamp-2 font-display text-[10px] italic leading-tight text-paper/70">
        {artist}
      </span>
    </div>
  );
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
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
