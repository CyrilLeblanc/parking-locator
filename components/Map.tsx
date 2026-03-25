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

const ZONE_PRICES: Record<string, string> = {
  vert: "1,5 €/h",
  orange: "2,5 €/h",
  violet: "3,5 €/h",
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
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 10,
          zIndex: 1000,
          background: "rgba(30,30,30,0.85)",
          borderRadius: 8,
          padding: "10px 14px",
          color: "#fff",
          fontSize: 13,
          lineHeight: "1.7",
          pointerEvents: "none",
        }}
      >
        {Object.entries(ZONE_COLORS).map(([zone, color]) => (
          <div key={zone} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: color, opacity: 0.85 }} />
            <span>{ZONE_PRICES[zone]}</span>
          </div>
        ))}
      </div>
    </MapContainer>
  );
}
