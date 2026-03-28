"use client";

import { useCallback, useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import { ZONE_COLORS } from "@/lib/zoneConfig";
import { useZones } from "@/hooks/use-zones";
import { useMapSelection } from "@/contexts/map-selection";
import { useFilters } from "@/contexts/filters";
import { zoneMatchesFilters } from "@/lib/parkingFilters";
import type { ZoneFeatureProperties } from "@/types/zone";

export default function ZonesLayer() {
  const { zones } = useZones();
  const { selectZone } = useMapSelection();
  const { activeFilters, activeFilterCount } = useFilters(); // activeFilterCount used in key to trigger re-render
  const selectZoneRef = useRef(selectZone);
  useEffect(() => {
    selectZoneRef.current = selectZone;
  });

  const zoneStyle = useCallback((feature?: GeoJSON.Feature): PathOptions => {
    const color = ZONE_COLORS[feature?.properties?.zone_color] ?? "#999";
    const matches = zoneMatchesFilters(activeFilters);
    return {
      color,
      fillColor: color,
      fillOpacity: matches ? 0.3 : 0.06,
      weight: 0,
    };
  }, [activeFilters]);

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
      key={`${zones.features.length}-${activeFilterCount}`}
      data={zones}
      style={zoneStyle}
      onEachFeature={onEachFeature}
    />
  );
}
