"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FeatureCollection } from "geojson";

async function fetchZones(): Promise<FeatureCollection> {
  const res = await fetch("/api/zones");
  if (!res.ok) throw new Error("Failed to fetch zones");
  return res.json();
}

type UseZonesResult = {
  zones: FeatureCollection | null;
  loading: boolean;
  error: boolean;
};

export function useZones(): UseZonesResult {
  const { data, isPending, isError } = useQuery({
    queryKey: ["zones"],
    queryFn: fetchZones,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Impossible de charger les zones de stationnement", {
        description: "Vérifiez votre connexion et rechargez la page.",
      });
    }
  }, [isError]);

  return { zones: data ?? null, loading: isPending, error: isError };
}
