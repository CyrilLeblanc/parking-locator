"use client";

import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";
import { ZONE_COLORS } from "@/lib/zoneConfig";

function zoneStyle(feature?: GeoJSON.Feature): PathOptions {
  const color = ZONE_COLORS[feature?.properties?.zone_color] ?? "#999";
  return {
    color,
    fillColor: color,
    fillOpacity: 0.3,
    weight: 1.5,
  };
}

export default function ZonesLayer() {
  const [zones, setZones] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/api/zones")
      .then((res) => res.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  if (!zones) return null;

  return (
    <GeoJSON key={zones.features.length} data={zones} style={zoneStyle} />
  );
}
