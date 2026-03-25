"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { FeatureCollection, Feature, Point } from "geojson";
import { FACILITY_LABELS } from "@/lib/parkingConfig";

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

type Availability = Record<string, { free_spaces: number | null }>;

function availabilityColor(freeSpaces: number | null | undefined): string {
  if (freeSpaces === undefined || freeSpaces === null) return "#7b8fa1";
  if (freeSpaces === 0) return "#f44336";
  return "#4caf50";
}

function parkingRadius(totalCapacity: number): number {
  return Math.max(6, Math.min(16, 5 + Math.sqrt(totalCapacity) * 0.55));
}

export default function ParkingsLayer() {
  const [parkings, setParkings] = useState<FeatureCollection | null>(null);
  const [availability, setAvailability] = useState<Availability>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/parkings").then((r) => r.json()),
      fetch("/api/availability").then((r) => r.json()),
    ])
      .then(([parkingsData, availabilityData]) => {
        setParkings(parkingsData);
        setAvailability(availabilityData);
      })
      .catch(console.error);
  }, []);

  if (!parkings) return null;

  return (
    <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={14}>
      {parkings.features.map((feature: Feature) => {
        const p = feature.properties as ParkingProps;
        const id = feature.id as string;
        const [lng, lat] = (feature.geometry as Point).coordinates;
        const avail = availability[id];
        const fillColor = availabilityColor(avail?.free_spaces);
        const radius = parkingRadius(p.total_capacity);

        return (
          <CircleMarker
            key={id}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{ color: "#ffffff", fillColor, fillOpacity: 0.9, weight: 1.5 }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: "sans-serif" }}>
                {avail !== undefined && avail.free_spaces !== null && (
                  <>
                    <AvailabilityBlock
                      freeSpaces={avail.free_spaces}
                      totalCapacity={p.total_capacity}
                      color={fillColor}
                    />
                    <Divider />
                  </>
                )}
                <div style={{ marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{p.name}</strong>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.address}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                    {FACILITY_LABELS[p.facility_type] ?? p.facility_type} · {p.total_capacity} places
                  </div>
                </div>
                {(p.free || p.disabled_spaces > 0 || p.ev_chargers > 0 || p.bike_spaces > 0) && (
                  <>
                    <Divider />
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.free && <Badge label="Gratuit" color="#4caf50" />}
                      {p.disabled_spaces > 0 && <Badge label="PMR" color="#2196f3" />}
                      {p.ev_chargers > 0 && <Badge label="Borne EV" color="#ff9800" />}
                      {p.bike_spaces > 0 && <Badge label="Vélo" color="#9c27b0" />}
                    </div>
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MarkerClusterGroup>
  );
}

function AvailabilityBlock({
  freeSpaces,
  totalCapacity,
  color,
}: {
  freeSpaces: number;
  totalCapacity: number;
  color: string;
}) {
  const pct = totalCapacity > 0 ? Math.round((freeSpaces / totalCapacity) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color, marginBottom: 6 }}>
        {freeSpaces === 0 ? "Complet" : `${freeSpaces} places libres`}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: "#e0e0e0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: color,
              borderRadius: 3,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
          {freeSpaces} / {totalCapacity}
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />;
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
