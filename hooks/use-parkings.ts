"use client";

import { useEffect, useState } from "react";
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
    Promise.all([
      fetch("/api/parkings").then((r) => r.json()),
      // If availability fails (502), fall back to empty rather than corrupt state
      fetch("/api/availability").then((r) => r.ok ? r.json() : {}),
    ])
      .then(([parkingsData, availabilityData]) => {
        setParkings(parkingsData);
        setAvailability(availabilityData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { parkings, availability, loading, error };
}
