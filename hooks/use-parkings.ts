"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FeatureCollection } from "geojson";
import type { Availability } from "@/types/parking";

type UseParkingsResult = {
  parkings: FeatureCollection | null;
  availability: Availability;
  loading: boolean;
  error: boolean;
};

export function useParkings(): UseParkingsResult {
  const [parkings, setParkings] = useState<FeatureCollection | null>(null);
  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      fetch("/api/parkings", { signal }).then((r) => r.json()),
      fetch("/api/availability", { signal }).then((r) => {
        if (!r.ok) {
          toast.warning("Données de disponibilité indisponibles", {
            description: "Les places libres ne sont pas affichées pour le moment.",
          });
          return {};
        }
        return r.json();
      }),
    ])
      .then(([parkingsData, availabilityData]) => {
        setParkings(parkingsData);
        setAvailability(availabilityData);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(true);
        toast.error("Impossible de charger les parkings", {
          description: "Vérifiez votre connexion et rechargez la page.",
        });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { parkings, availability, loading, error };
}
