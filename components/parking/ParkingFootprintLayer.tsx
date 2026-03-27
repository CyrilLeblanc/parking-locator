"use client";

import { Polygon } from "react-leaflet";
import type { Polygon as GeoJSONPolygon, MultiPolygon } from "geojson";
import { useMapSelection } from "@/contexts/map-selection";

type LatLngTuple = [number, number];

function geoJsonRingToLeaflet(ring: number[][]): LatLngTuple[] {
  return ring.map(([lng, lat]) => [lat, lng]);
}

export default function ParkingFootprintLayer() {
  const { selectedParking } = useMapSelection();

  if (!selectedParking?.footprint) return null;

  const { footprint, source } = selectedParking;
  const color = source === "osm" ? "#78909c" : "#1565c0";
  const pathOptions = { color, fillColor: color, fillOpacity: 0.15, weight: 2 };

  if (footprint.type === "Polygon") {
    return (
      <Polygon
        positions={geoJsonRingToLeaflet((footprint as GeoJSONPolygon).coordinates[0])}
        pathOptions={pathOptions}
      />
    );
  }

  if (footprint.type === "MultiPolygon") {
    const rings = (footprint as MultiPolygon).coordinates.map((poly) =>
      geoJsonRingToLeaflet(poly[0])
    );
    return <Polygon positions={rings} pathOptions={pathOptions} />;
  }

  return null;
}
