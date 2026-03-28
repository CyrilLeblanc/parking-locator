"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
    const controller = new AbortController();

    fetch("/api/zones", { signal: controller.signal })
      .then((res) => res.json())
      .then(setZones)
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(true);
        toast.error("Impossible de charger les zones de stationnement", {
          description: "Vérifiez votre connexion et rechargez la page.",
        });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { zones, loading, error };
}
