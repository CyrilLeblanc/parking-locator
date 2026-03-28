"use client";

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/constants";

/** Parses "#zoom/lat/lng" hash, returns null if invalid. */
function parseHash(hash: string): { center: [number, number]; zoom: number } | null {
  const match = hash.replace("#", "").match(/^(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const zoom = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  const lng = parseFloat(match[3]);
  if (isNaN(zoom) || isNaN(lat) || isNaN(lng)) return null;
  return { center: [lat, lng], zoom };
}

function buildHash(lat: number, lng: number, zoom: number): string {
  return `#${zoom}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
}

export default function MapHashSync() {
  const map = useMap();

  // On mount, restore position from hash
  useEffect(() => {
    const parsed = parseHash(window.location.hash);
    if (parsed) {
      map.setView(parsed.center, parsed.zoom, { animate: false });
    }
  }, [map]);

  // On move/zoom end, update hash
  useMapEvents({
    moveend() {
      const center = map.getCenter();
      window.location.replace(buildHash(center.lat, center.lng, map.getZoom()));
    },
  });

  return null;
}
