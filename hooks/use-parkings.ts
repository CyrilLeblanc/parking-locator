"use client";

import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { Availability } from "@/types/parking";

type UseParkingsResult = {
  parkings: FeatureCollection | null;
  availability: Availability;
  loading: boolean;
};

export function useParkings(): UseParkingsResult {
  const [parkings, setParkings] = useState<FeatureCollection | null>(null);
  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/parkings").then((r) => r.json()),
      fetch("/api/availability").then((r) => r.json()),
    ])
      .then(([parkingsData, availabilityData]) => {
        setParkings(parkingsData);
        setAvailability(availabilityData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { parkings, availability, loading };
}
