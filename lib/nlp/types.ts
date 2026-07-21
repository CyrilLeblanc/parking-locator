// Types for the natural-language parking search.
//
// Transfer types (DTO) are a faithful mirror of the R/plumber wire contract
// (producer: nlp-processor/agent.R + plumber.R). The response is validated by
// PlumberResponseSchema in lib/schemas.ts at the client boundary.
//
// Domain types (RankedParking, ParkingSearchResult) are what the rest of the
// Next.js app consumes; they keep the R naming out of the domain.

export type Medal = "gold" | "silver" | "bronze";

export type RankingCriterion = "capacity" | "ev" | "pmr" | "carpool" | "distance";

// One parking row sent to the R service (see nlp-processor/README.md contract).
export type PlumberRow = {
  id: string;
  nom: string;
  ylat: number;
  xlong: number;
  gratuit: boolean;
  nb_places: number;
  nb_voitures_electriques: number;
  nb_velo: number;
  nb_pmr: number;
  nb_covoit: number;
};

// Body POSTed to the R /query endpoint.
export type PlumberRequest = {
  question: string;
  parkings: PlumberRow[];
  lat?: number;
  lon?: number;
};

// Response type is inferred from the Zod schema (single source of truth).
export type { PlumberResponse } from "@/lib/schemas";

// ---------------------------------------------------------------------------
// Domain types (Next.js side)
// ---------------------------------------------------------------------------

export type RankedParking = {
  id: string;
  rank: number;
  medal: Medal | null;
  distanceKm: number | null;
};

export type ParkingSearchResult = {
  message: string;
  rankingCriterion: RankingCriterion | null;
  intent: {
    topN: number | null;
    filters: string[];
  };
  results: RankedParking[];
};
