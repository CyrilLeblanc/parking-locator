"use client";

import { useEffect, useState } from "react";
import type { HistoryData } from "@/types/parking";

type UseParkingHistoryResult = {
  history: HistoryData | null;
  loading: boolean;
  error: boolean;
};

type FetchResult = {
  history: HistoryData | null;
  error: boolean;
  forId: string;
  forDay: number;
};

export function useParkingHistory(parkingId: string | null, day: number): UseParkingHistoryResult {
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (parkingId === null) return;
    const controller = new AbortController();
    fetch(`/api/parkings/${parkingId}/history?day=${day}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: HistoryData) =>
        setResult({ history: data, error: false, forId: parkingId, forDay: day })
      )
      .catch((err) => {
        if ((err as Error).name !== "AbortError")
          setResult({ history: null, error: true, forId: parkingId, forDay: day });
      });
    return () => controller.abort();
  }, [parkingId, day]);

  if (parkingId === null) return { history: null, loading: false, error: false };

  const isStale = result === null || result.forId !== parkingId || result.forDay !== day;
  if (isStale) return { history: null, loading: true, error: false };
  return { history: result.history, loading: false, error: result.error };
}
