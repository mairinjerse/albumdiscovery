import type { Familiarity, Tier } from "./types";

export function tierForListeners(listeners: number): Tier {
  if (listeners >= 2_000_000) return "household";
  if (listeners >= 500_000) return "well_known";
  if (listeners >= 50_000) return "growing";
  if (listeners >= 5_000) return "under_radar";
  return "obscure";
}

export const TIERS_BY_FAMILIARITY: Record<Familiarity, Tier[]> = {
  mainstream: ["household", "well_known"],
  on_the_rise: ["growing", "well_known"],
  unknown: ["obscure", "under_radar"],
};

export const TIER_LABEL: Record<Tier, string> = {
  household: "household name",
  well_known: "well known",
  growing: "growing",
  under_radar: "under the radar",
  obscure: "genuinely obscure",
};
