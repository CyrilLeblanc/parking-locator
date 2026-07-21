"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Marker, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Feature, Point, Polygon as GeoJSONPolygon, MultiPolygon, Geometry } from "geojson";
import L from "leaflet";
import { Bus } from "lucide-react";
import type { ParkingFeatureProperties } from "@/types/parking";
import { ParkingPinIcon } from "./ParkingPinIcon";
import { useParkings } from "@/hooks/use-parkings";
import { useMapSelection } from "@/contexts/map-selection";
import { useFilters } from "@/contexts/filters";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { matchesParkingFilters } from "@/lib/parkingFilters";
import { estimateParkingFare, formatFareValue } from "@/lib/fareEstimation";
import { featureToSelectedParking } from "@/lib/parking-selection";
import { panToParking, SHEET_WIDTH, DRAWER_SNAP } from "@/contexts/map-instance";

function makeDivIcon(
  bubbleBg: string,
  bubbleText: string,
  pinColor: string,
  glyph?: ReactNode
): L.DivIcon {
  const bubbleFontSize = bubbleText.length > 2 ? "9px" : "11px";
  return L.divIcon({
    html: renderToStaticMarkup(
      <ParkingPinIcon bubbleBg={bubbleBg} bubbleText={bubbleText} bubbleFontSize={bubbleFontSize} pinColor={pinColor} glyph={glyph} />
    ),
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

const FOOTPRINT_MAX_ZOOM = 17;

function footprintToBounds(footprint: Geometry): L.LatLngBounds | null {
  let coords: number[][];
  if (footprint.type === "Polygon") {
    coords = (footprint as GeoJSONPolygon).coordinates[0];
  } else if (footprint.type === "MultiPolygon") {
    coords = (footprint as MultiPolygon).coordinates.flatMap((poly) => poly[0]);
  } else {
    return null;
  }
  const latLngs = coords.map(([lng, lat]) => L.latLng(lat, lng));
  return L.latLngBounds(latLngs);
}

export default function ParkingsLayer() {
  const map = useMap();
  const isMobile = useIsMobile();
  const iconCache = useRef(new Map<string, L.DivIcon>());

  function getParkingIcon(
    freeSpaces: number | null | undefined,
    relais: boolean
  ): L.DivIcon {
    // Relais (P+R) parkings get a distinct teal pin with a bus glyph so they no
    // longer read as ordinary parkings. Availability still drives the bubble.
    const pinColor = relais ? "#00897b" : "#1565c0";
    const glyph = relais ? <Bus color="white" size={14} strokeWidth={2.5} /> : undefined;
    const prefix = relais ? "relais-" : "";
    const cache = iconCache.current;

    if (freeSpaces === null || freeSpaces === undefined) {
      const key = `${prefix}unknown`;
      if (!cache.has(key)) cache.set(key, makeDivIcon("#7b8fa1", "–", pinColor, glyph));
      return cache.get(key)!;
    }
    if (freeSpaces === 0) {
      const key = `${prefix}full`;
      if (!cache.has(key)) cache.set(key, makeDivIcon("#f44336", "0", pinColor, glyph));
      return cache.get(key)!;
    }
    if (freeSpaces <= 9) {
      const key = `${prefix}orange-${freeSpaces}`;
      if (!cache.has(key)) cache.set(key, makeDivIcon("#ff9800", String(freeSpaces), pinColor, glyph));
      return cache.get(key)!;
    }

    const text = freeSpaces > 99 ? "99+" : String(freeSpaces);
    const key = `${prefix}green-${text}`;
    if (!cache.has(key)) cache.set(key, makeDivIcon("#4caf50", text, pinColor, glyph));
    return cache.get(key)!;
  }
  const { parkings, availability } = useParkings();
  const { selectParking, selectedParkingId, selectedParking } = useMapSelection();
  const { estimationDuration, activeFilters, activeFilterCount } = useFilters();

  // Restore selection from URL on initial load
  useEffect(() => {
    if (!parkings || !selectedParkingId || selectedParking) return;
    const feature = parkings.features.find((f) => f.id === selectedParkingId);
    if (!feature) return;
    const avail = availability[selectedParkingId];
    selectParking(featureToSelectedParking(feature, avail?.free_spaces ?? null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkings]);

  if (!parkings) return null;

  return (
    <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={14} iconCreateFunction={createClusterIcon}>
      {parkings.features.map((feature: Feature) => {
        const p = feature.properties as ParkingFeatureProperties;
        const id = feature.id as string;
        const [lng, lat] = (feature.geometry as Point).coordinates;
        const avail = availability[id];
        if (p.source === "osm") return null;
        const isRelais = (p.relais_spaces ?? 0) > 0;
        const icon = getParkingIcon(avail?.free_spaces, isRelais);
        const matches = activeFilterCount === 0 || matchesParkingFilters(p, activeFilters);

        let priceLabel: string | null = null;
        if (estimationDuration !== null) {
          if (p.free) {
            priceLabel = "Gratuit";
          } else {
            const estimated = estimateParkingFare(p, estimationDuration);
            priceLabel = estimated !== null ? formatFareValue(estimated) : "?";
          }
        }

        return (
          <Marker
            key={`${id}-${estimationDuration ?? "none"}`}
            position={[lat, lng]}
            icon={icon}
            opacity={matches ? 1 : 0.2}
            eventHandlers={{
              click: (e) => {
                // Empêche la propagation vers les layers dessous (ZonesLayer)
                // qui appellerait selectZone et effacerait la sélection du parking
                L.DomEvent.stopPropagation(e);
                selectParking(featureToSelectedParking(feature, avail?.free_spaces ?? null));

                if (p.footprint) {
                  const { y: mapH } = map.getSize();
                  const bottomRight = isMobile
                    ? L.point(0, mapH * DRAWER_SNAP)
                    : L.point(SHEET_WIDTH, 0);
                  const bounds = footprintToBounds(p.footprint);
                  if (bounds) {
                    map.fitBounds(bounds, {
                      paddingBottomRight: bottomRight,
                      maxZoom: FOOTPRINT_MAX_ZOOM,
                      animate: true,
                    });
                    return;
                  }
                }

                panToParking(map, { lat, lng }, isMobile);
              },
            }}
          >
            {priceLabel !== null && (
              <Tooltip key={String(matches)} permanent direction="bottom" offset={[0, 4]} className="price-tooltip" opacity={matches ? 1 : 0.2}>
                {priceLabel}
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}
