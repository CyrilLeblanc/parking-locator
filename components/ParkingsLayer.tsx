"use client";

import { useEffect, useState } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { FeatureCollection, Feature, Point } from "geojson";
import L from "leaflet";
import type { SelectedParking } from "./ParkingBottomSheet";

type ParkingProps = {
  name: string;
  address: string;
  city: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  fare_1h?: number | null;
  fare_2h?: number | null;
  fare_3h?: number | null;
  fare_4h?: number | null;
  fare_24h?: number | null;
  subscription_resident?: number | null;
  subscription_non_resident?: number | null;
};

type Availability = Record<string, { free_spaces: number | null }>;

function parkingIconSize(totalCapacity: number): number {
  return Math.round(Math.max(24, Math.min(40, 18 + Math.sqrt(totalCapacity) * 1.1)));
}

/** Returns the SVG path for a pie slice starting from 12 o'clock, going clockwise by `pct` (0–1). */
function pieSlicePath(cx: number, cy: number, r: number, pct: number): string {
  const start = -Math.PI / 2;
  const end = start + pct * 2 * Math.PI;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = pct > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function createParkingIcon(freeSpaces: number | null | undefined, totalCapacity: number): L.DivIcon {
  const size = parkingIconSize(totalCapacity);
  const cx = size / 2;
  const r = cx - 1.5; // leave room for the border stroke

  let inner: string;

  if (freeSpaces === null || freeSpaces === undefined) {
    inner = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="#7b8fa1"/>`;
  } else if (freeSpaces === 0) {
    inner = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="#f44336"/>`;
  } else if (freeSpaces >= totalCapacity) {
    inner = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="#4caf50"/>`;
  } else {
    const occupiedPct = (totalCapacity - freeSpaces) / totalCapacity;
    const path = pieSlicePath(cx, cx, r, occupiedPct);
    inner = `
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="#4caf50"/>
      <path d="${path}" fill="#f44336"/>
    `;
  }

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${inner}
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="white" stroke-width="1.5"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [cx, cx],
  });
}

type Props = {
  onParkingClick: (p: SelectedParking) => void;
};

export default function ParkingsLayer({ onParkingClick }: Props) {
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
        const icon = createParkingIcon(avail?.free_spaces, p.total_capacity);

        return (
          <Marker
            key={id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () =>
                onParkingClick({
                  id,
                  name: p.name,
                  address: p.address,
                  city: p.city,
                  facility_type: p.facility_type,
                  free: p.free,
                  total_capacity: p.total_capacity,
                  disabled_spaces: p.disabled_spaces,
                  ev_chargers: p.ev_chargers,
                  bike_spaces: p.bike_spaces,
                  fare_1h: p.fare_1h,
                  fare_2h: p.fare_2h,
                  fare_3h: p.fare_3h,
                  fare_4h: p.fare_4h,
                  fare_24h: p.fare_24h,
                  subscription_resident: p.subscription_resident,
                  subscription_non_resident: p.subscription_non_resident,
                  free_spaces: avail?.free_spaces ?? null,
                }),
            }}
          />
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

