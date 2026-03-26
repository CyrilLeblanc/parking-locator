"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GeoJSON } from "react-leaflet";
import type { FeatureCollection, Feature } from "geojson";
import type { Layer, PathOptions } from "leaflet";
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

type Props = {
  onZoneClick: (zone_color: string) => void;
};

export default function ZonesLayer({ onZoneClick }: Props) {
  const [zones, setZones] = useState<FeatureCollection | null>(null);
  const onClickRef = useRef(onZoneClick);

  useEffect(() => {
    onClickRef.current = onZoneClick;
  }, [onZoneClick]);

  useEffect(() => {
    fetch("/api/zones")
      .then((res) => res.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  // Stable callback — uses ref so closure never goes stale
  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    (layer as L.Path).on("click", () => {
      const zone_color = feature.properties?.zone_color;
      if (zone_color) onClickRef.current(zone_color);
    });
  }, []);

  if (!zones) return null;

  return (
    <GeoJSON
      key={zones.features.length}
      data={zones}
      style={zoneStyle}
      onEachFeature={onEachFeature}
    />
  );
}
