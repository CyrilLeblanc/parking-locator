"use client";

import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

type UseZonesResult = {
  zones: FeatureCollection | null;
  loading: boolean;
};

export function useZones(): UseZonesResult {
  const [zones, setZones] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/zones")
      .then((res) => res.json())
      .then(setZones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { zones, loading };
}
