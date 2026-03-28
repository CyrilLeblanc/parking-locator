"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FeatureCollection } from "geojson";
import type { Availability } from "@/types/parking";

async function fetchParkings(): Promise<FeatureCollection> {
  const res = await fetch("/api/parkings");
  if (!res.ok) throw new Error("Failed to fetch parkings");
  return res.json();
}

async function fetchAvailability(): Promise<Availability> {
  const res = await fetch("/api/availability");
  if (!res.ok) throw new Error("Availability unavailable");
  return res.json();
}

type UseParkingsResult = {
  parkings: FeatureCollection | null;
  availability: Availability;
  loading: boolean;
  error: boolean;
};

export function useParkings(): UseParkingsResult {
  const parkingsQuery = useQuery({
    queryKey: ["parkings"],
    queryFn: fetchParkings,
    staleTime: Infinity,
  });

  const availabilityQuery = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    refetchInterval: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (parkingsQuery.isError) {
      toast.error("Impossible de charger les parkings", {
        description: "Vérifiez votre connexion et rechargez la page.",
      });
    }
  }, [parkingsQuery.isError]);

  useEffect(() => {
    if (availabilityQuery.isError) {
      toast.warning("Données de disponibilité indisponibles", {
        description: "Les places libres ne sont pas affichées pour le moment.",
      });
    }
  }, [availabilityQuery.isError]);

  return {
    parkings: parkingsQuery.data ?? null,
    availability: availabilityQuery.data ?? {},
    loading: parkingsQuery.isPending,
    error: parkingsQuery.isError,
  };
}
