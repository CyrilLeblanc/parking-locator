"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ParkingSearchResult } from "@/lib/nlp/types";

async function searchParkings(payload: {
  q: string;
  lat?: number;
  lng?: number;
}): Promise<ParkingSearchResult> {
  const res = await fetch("/api/parkings/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

// Debounced natural-language parking search. Fires only once the query is
// long enough; keeps the previous results visible while typing to avoid
// flicker. The user's geolocation, when available, enables distance ranking.
export function useParkingSearch(q: string, lat?: number, lng?: number) {
  const trimmed = q.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmed]);

  const enabled = debounced.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: ["parking-search", debounced, lat ?? null, lng ?? null],
    queryFn: () => searchParkings({ q: debounced, lat, lng }),
    enabled,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
