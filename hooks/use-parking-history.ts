"use client";

import { useQuery } from "@tanstack/react-query";
import { HistoryDataSchema } from "@/lib/schemas";
import type { HistoryData } from "@/types/parking";

type UseParkingHistoryResult = {
  history: HistoryData | null;
  loading: boolean;
  error: boolean;
};

export function useParkingHistory(parkingId: string | null, day: number): UseParkingHistoryResult {
  const { data, isPending, isError } = useQuery({
    queryKey: ["parking-history", parkingId, day],
    queryFn: async () => {
      const res = await fetch(`/api/parkings/${parkingId}/history?day=${day}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return HistoryDataSchema.parse(await res.json());
    },
    enabled: parkingId !== null,
    staleTime: 5 * 60_000,
  });

  if (parkingId === null) return { history: null, loading: false, error: false };
  return { history: data ?? null, loading: isPending, error: isError };
}
