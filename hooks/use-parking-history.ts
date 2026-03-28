"use client";

import { useEffect, useState } from "react";
import type { HistoryData } from "@/types/parking";

type UseParkingHistoryResult = {
  history: HistoryData | null;
  loading: boolean;
  error: boolean;
};

export function useParkingHistory(parkingId: string | null, day: number): UseParkingHistoryResult {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (parkingId === null) {
      setHistory(null);
      setLoading(false);
      setError(false);
      return;
    }
    setHistory(null);
    setLoading(true);
    setError(false);
    const controller = new AbortController();
    fetch(`/api/parkings/${parkingId}/history?day=${day}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: HistoryData) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [parkingId, day]);

  return { history, loading, error };
}
