"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { FeatureCollection, Feature, Point } from "geojson";
import L from "leaflet";
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
    <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={14} iconCreateFunction={createClusterIcon}>
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
              <div className="min-w-[200px] font-sans">
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
                <div className="mb-1">
                  <strong className="text-sm">{p.name}</strong>
                  <div className="text-xs text-[#888] mt-0.5">{p.address}</div>
                  <div className="text-xs text-[#555] mt-1">
                    {FACILITY_LABELS[p.facility_type] ?? p.facility_type} · {p.total_capacity} places
                  </div>
                </div>
                {(p.free || p.disabled_spaces > 0 || p.ev_chargers > 0 || p.bike_spaces > 0) && (
                  <>
                    <Divider />
                    <div className="flex gap-1 flex-wrap">
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

function createClusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 20 ? 40 : 46;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:rgba(20,20,20,0.88);border:2px solid #fff;
      color:#fff;font-weight:700;font-size:${size < 40 ? 13 : 15}px;
      display:flex;align-items:center;justify-content:center;
      font-family:sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.4);
    ">${count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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
    <div className="mb-2">
      <div className="font-bold text-[15px] mb-1.5" style={{ color }}>
        {freeSpaces === 0 ? "Complet" : `${freeSpaces} places libres`}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded bg-[#e0e0e0] overflow-hidden">
          <div
            className="h-full rounded transition-[width] duration-300"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="text-[11px] text-[#888] whitespace-nowrap">
          {freeSpaces} / {totalCapacity}
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <hr className="border-0 border-t border-[#eee] my-2" />;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-white rounded px-1.5 py-px text-[11px] font-semibold"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
