"use client";

import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { FeatureCollection, Feature, Point } from "geojson";
import L from "leaflet";
import type { SelectedParking } from "./ParkingBottomSheet";
import { ParkingPinIcon } from "./ParkingPinIcon";

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

function createParkingIcon(freeSpaces: number | null | undefined): L.DivIcon {
  let bubbleBg: string;
  let bubbleText: string;

  if (freeSpaces === null || freeSpaces === undefined) {
    bubbleBg = "#7b8fa1";
    bubbleText = "–";
  } else if (freeSpaces === 0) {
    bubbleBg = "#f44336";
    bubbleText = "0";
  } else if (freeSpaces <= 9) {
    bubbleBg = "#ff9800";
    bubbleText = String(freeSpaces);
  } else {
    bubbleBg = "#4caf50";
    bubbleText = freeSpaces > 99 ? "99+" : String(freeSpaces);
  }

  const bubbleFontSize = bubbleText.length > 2 ? "9px" : "11px";

  const html = renderToStaticMarkup(
    <ParkingPinIcon bubbleBg={bubbleBg} bubbleText={bubbleText} bubbleFontSize={bubbleFontSize} />
  );

  return L.divIcon({
    html,
    className: "",
    iconSize: [36, 44],
    iconAnchor: [14, 42],
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
        const icon = createParkingIcon(avail?.free_spaces);

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

