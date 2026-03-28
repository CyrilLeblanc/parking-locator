"use client";

import { renderToStaticMarkup } from "react-dom/server";
import { Marker, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Feature, Point, Polygon as GeoJSONPolygon, MultiPolygon, Geometry } from "geojson";
import L from "leaflet";
import type { ParkingFeatureProperties } from "@/types/parking";
import { ParkingPinIcon } from "./ParkingPinIcon";
import { useParkings } from "@/hooks/use-parkings";
import { useMapSelection } from "@/contexts/map-selection";
import { useFilters } from "@/contexts/filters";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { matchesParkingFilters } from "@/lib/parkingFilters";
import { estimateParkingFare, formatFareValue } from "@/lib/fareEstimation";

function makeDivIcon(bubbleBg: string, bubbleText: string, pinColor: string): L.DivIcon {
  const bubbleFontSize = bubbleText.length > 2 ? "9px" : "11px";
  return L.divIcon({
    html: renderToStaticMarkup(
      <ParkingPinIcon bubbleBg={bubbleBg} bubbleText={bubbleText} bubbleFontSize={bubbleFontSize} pinColor={pinColor} />
    ),
    className: "",
    iconSize: [36, 44],
    iconAnchor: [14, 42],
  });
}

// Icône partagée pour tous les parkings OSM : pin gris, pas de bulle
const OSM_ICON = L.divIcon({
  html: renderToStaticMarkup(<ParkingPinIcon pinColor="#78909c" />),
  className: "",
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

// Cache pour les icônes LaMetro — couvre tous les états : unknown, full, 1-9 (orange), 10-99, 99+
const ICON_CACHE = new Map<string, L.DivIcon>();

function createParkingIcon(freeSpaces: number | null | undefined, source: string): L.DivIcon {
  if (source === "osm") return OSM_ICON;

  const pinColor = "#1565c0";

  if (freeSpaces === null || freeSpaces === undefined) {
    const key = "unknown";
    if (!ICON_CACHE.has(key)) ICON_CACHE.set(key, makeDivIcon("#7b8fa1", "–", pinColor));
    return ICON_CACHE.get(key)!;
  }
  if (freeSpaces === 0) {
    const key = "full";
    if (!ICON_CACHE.has(key)) ICON_CACHE.set(key, makeDivIcon("#f44336", "0", pinColor));
    return ICON_CACHE.get(key)!;
  }

  // 1-9 : 9 valeurs possibles, toutes cachées
  if (freeSpaces <= 9) {
    const key = `orange-${freeSpaces}`;
    if (!ICON_CACHE.has(key)) ICON_CACHE.set(key, makeDivIcon("#ff9800", String(freeSpaces), pinColor));
    return ICON_CACHE.get(key)!;
  }

  const text = freeSpaces > 99 ? "99+" : String(freeSpaces);
  const key = `green-${text}`;
  if (!ICON_CACHE.has(key)) ICON_CACHE.set(key, makeDivIcon("#4caf50", text, pinColor));
  return ICON_CACHE.get(key)!;
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

const SHEET_WIDTH = 400;
const DRAWER_SNAP = 0.5;
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
  const { parkings, availability } = useParkings();
  const { selectParking } = useMapSelection();
  const { estimationDuration, activeFilters, activeFilterCount } = useFilters();

  if (!parkings) return null;

  return (
    <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={14} iconCreateFunction={createClusterIcon}>
      {parkings.features.map((feature: Feature) => {
        const p = feature.properties as ParkingFeatureProperties;
        const id = feature.id as string;
        const [lng, lat] = (feature.geometry as Point).coordinates;
        const avail = availability[id];
        const icon = createParkingIcon(avail?.free_spaces, p.source);
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
                selectParking({
                  id,
                  lat,
                  lng,
                  name: p.name,
                  address: p.address,
                  city: p.city,
                  facility_type: p.facility_type,
                  free: p.free,
                  total_capacity: p.total_capacity,
                  disabled_spaces: p.disabled_spaces,
                  ev_chargers: p.ev_chargers,
                  bike_spaces: p.bike_spaces,
                  operator: p.operator ?? null,
                  source: p.source,
                  footprint: p.footprint ?? null,
                  fare_1h: p.fare_1h,
                  fare_2h: p.fare_2h,
                  fare_3h: p.fare_3h,
                  fare_4h: p.fare_4h,
                  fare_24h: p.fare_24h,
                  subscription_resident: p.subscription_resident,
                  subscription_non_resident: p.subscription_non_resident,
                  free_spaces: avail?.free_spaces ?? null,
                });
                const { x: mapW, y: mapH } = map.getSize();
                const bottomRight = isMobile
                  ? L.point(0, mapH * DRAWER_SNAP)
                  : L.point(SHEET_WIDTH, 0);

                if (p.footprint) {
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

                // Fallback sans footprint : pan vers l'espace visible
                const targetX = isMobile ? mapW / 2 : (mapW - SHEET_WIDTH) / 2;
                const targetY = isMobile ? (mapH * (1 - DRAWER_SNAP)) / 2 : mapH / 2;
                const currentPt = map.latLngToContainerPoint([lat, lng]);
                map.panBy(
                  [currentPt.x - targetX, currentPt.y - targetY],
                  { animate: true, duration: 0.3 }
                );
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
