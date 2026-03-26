"use client";

import { renderToStaticMarkup } from "react-dom/server";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Feature, Point } from "geojson";
import L from "leaflet";
import type { ParkingFeatureProperties } from "@/types/parking";
import { ParkingPinIcon } from "./ParkingPinIcon";
import { useParkings } from "@/hooks/use-parkings";
import { useMapSelection } from "@/contexts/map-selection";

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

export default function ParkingsLayer() {
  const { parkings, availability } = useParkings();
  const { selectParking } = useMapSelection();

  if (!parkings) return null;

  return (
    <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={14} iconCreateFunction={createClusterIcon}>
      {parkings.features.map((feature: Feature) => {
        const p = feature.properties as ParkingFeatureProperties;
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
                selectParking({
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
