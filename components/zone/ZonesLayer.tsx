"use client";

import { useCallback, useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import { ZONE_COLORS } from "@/lib/zoneConfig";
import { useZones } from "@/hooks/use-zones";
import { useMapSelection } from "@/contexts/map-selection";
import type { ZoneFeatureProperties } from "@/types/zone";

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
  const { zones } = useZones();
  const { selectZone } = useMapSelection();
  const selectZoneRef = useRef(selectZone);
  useEffect(() => {
    selectZoneRef.current = selectZone;
  });

  // Stable callback — uses ref so closure never goes stale
  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    (layer as L.Path).on("click", () => {
      if (feature.properties?.zone_color) {
        selectZoneRef.current(feature.properties as ZoneFeatureProperties);
      }
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
