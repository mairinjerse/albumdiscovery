export type Familiarity = "mainstream" | "on_the_rise" | "unknown";

export type Tier = "household" | "well_known" | "growing" | "under_radar" | "obscure";

export interface RecommendInput {
  activities: string[];
  vibe?: string;
  energy?: string;
  familiarity: Familiarity;
  referenceAlbum?: string;
  genre?: string;
}

export interface Candidate {
  artist: string;
  album: string;
  reason: string;
  history: string;
}

export interface VerifiedResult extends Candidate {
  listeners: number;
  tier: Tier;
  image: string | null;
  spotifyUrl: string;
}

export interface SavedAlbum {
  id: string;
  user_id: string;
  artist: string;
  album: string;
  reason: string | null;
  history: string | null;
  image: string | null;
  tier: Tier | null;
  spotify_url: string | null;
  note: string | null;
  share_slug: string | null;
  created_at: string;
}
