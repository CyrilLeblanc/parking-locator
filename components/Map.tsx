"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

const ZONE_COLORS: Record<string, string> = {
  vert: "#4caf50",
  orange: "#ff9800",
  violet: "#9c27b0",
};

function zoneStyle(feature?: GeoJSON.Feature): PathOptions {
  const color = ZONE_COLORS[feature?.properties?.zone_color] ?? "#999";
  return {
    color,
    fillColor: color,
    fillOpacity: 0.3,
    weight: 1.5,
  };
}

export default function Map() {
  const [zones, setZones] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/api/zones")
      .then((res) => res.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  return (
    <MapContainer
      center={[45.1885, 5.7245]}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://data.mobilites-m.fr/carte-dark/{z}/{x}/{y}.png"
      />
      {zones && (
        <GeoJSON
          key={zones.features.length}
          data={zones}
          style={zoneStyle}
        />
      )}
    </MapContainer>
  );
}
