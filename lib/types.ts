export type Familiarity = "mainstream" | "on_the_rise" | "unknown";

export type Tier = "household" | "well_known" | "growing" | "under_radar" | "obscure";

export interface RecommendInput {
  activities: string[];
  vibe?: string;
  familiarity: Familiarity;
  referenceAlbum?: string;
  genre?: string;
}

export interface Candidate {
  artist: string;
  album: string;
  reason: string;
}

export interface VerifiedResult extends Candidate {
  listeners: number;
  tier: Tier;
  image: string | null;
  spotifyUrl: string;
}
