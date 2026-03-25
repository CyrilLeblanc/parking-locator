"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import type { FeatureCollection, Feature, Point } from "geojson";
import { FACILITY_COLORS, FACILITY_LABELS } from "@/lib/parkingConfig";

type ParkingProps = {
  name: string;
  address: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
};

export default function ParkingsLayer() {
  const [parkings, setParkings] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/api/parkings")
      .then((res) => res.json())
      .then(setParkings)
      .catch(console.error);
  }, []);

  if (!parkings) return null;

  return (
    <>
      {parkings.features.map((feature: Feature) => {
        const p = feature.properties as ParkingProps;
        const [lng, lat] = (feature.geometry as Point).coordinates;
        const color = FACILITY_COLORS[p.facility_type] ?? "#999";

        return (
          <CircleMarker
            key={feature.id as string}
            center={[lat, lng]}
            radius={8}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1.5 }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{p.name}</strong>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{p.address}</div>
                <div style={{ marginBottom: 6 }}>
                  {FACILITY_LABELS[p.facility_type] ?? p.facility_type}
                </div>
                <div style={{ marginBottom: 8 }}>
                  {p.total_capacity} places
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.free && <Badge label="Gratuit" color="#4caf50" />}
                  {p.disabled_spaces > 0 && <Badge label="PMR" color="#2196f3" />}
                  {p.ev_chargers > 0 && <Badge label="Borne EV" color="#ff9800" />}
                  {p.bike_spaces > 0 && <Badge label="Vélo" color="#9c27b0" />}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        borderRadius: 4,
        padding: "1px 6px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
