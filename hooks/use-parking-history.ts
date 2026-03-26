"use client";

import { useEffect, useState } from "react";
import type { HistoryData } from "@/types/parking";

type UseParkingHistoryResult = {
  history: HistoryData | null;
  loading: boolean;
};

export function useParkingHistory(parkingId: string, day: number): UseParkingHistoryResult {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHistory(null);
    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/parkings/${parkingId}/history?day=${day}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: HistoryData) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, [parkingId, day]);

  return { history, loading };
}
