"use client";

import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

type UseZonesResult = {
  zones: FeatureCollection | null;
  loading: boolean;
  error: boolean;
};

export function useZones(): UseZonesResult {
  const [zones, setZones] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/zones")
      .then((res) => res.json())
      .then(setZones)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { zones, loading, error };
}
