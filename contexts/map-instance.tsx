"use client";

import { createContext, useContext, type ReactNode, type RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";

// UI constants shared by the "select a parking and leave room for the sheet"
// pan logic. Kept here so the marker click and the search results pan the
// same way.
export const SHEET_WIDTH = 400;
export const DRAWER_SNAP = 0.5;

// Exposes the Leaflet map instance to overlay components that live outside
// <MapContainer> (where useMap() is unavailable) — e.g. the search results.
const MapInstanceContext = createContext<RefObject<LeafletMap | null> | null>(null);

export function MapInstanceProvider({
  mapRef,
  children,
}: {
  mapRef: RefObject<LeafletMap | null>;
  children: ReactNode;
}) {
  return (
    <MapInstanceContext.Provider value={mapRef}>
      {children}
    </MapInstanceContext.Provider>
  );
}

export function useMapInstance(): RefObject<LeafletMap | null> {
  const ctx = useContext(MapInstanceContext);
  if (!ctx) {
    throw new Error("useMapInstance must be used within MapInstanceProvider");
  }
  return ctx;
}

// Pans the map so the given point lands in the area not covered by the
// bottom sheet / side sheet. Mirrors the fallback pan in the marker click.
export function panToParking(
  map: LeafletMap,
  coords: { lat: number; lng: number },
  isMobile: boolean
) {
  const { x: mapW, y: mapH } = map.getSize();
  const targetX = isMobile ? mapW / 2 : (mapW - SHEET_WIDTH) / 2;
  const targetY = isMobile ? (mapH * (1 - DRAWER_SNAP)) / 2 : mapH / 2;
  const currentPt = map.latLngToContainerPoint([coords.lat, coords.lng]);
  map.panBy([currentPt.x - targetX, currentPt.y - targetY], {
    animate: true,
    duration: 0.3,
  });
}
