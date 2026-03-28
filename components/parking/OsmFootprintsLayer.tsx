"use client";

import { useState } from "react";
import { Polygon, useMap, useMapEvent } from "react-leaflet";
import type { Feature, Point, Polygon as GeoJSONPolygon, MultiPolygon } from "geojson";
import L from "leaflet";
import type { ParkingFeatureProperties } from "@/types/parking";
import { useParkings } from "@/hooks/use-parkings";
import { useMapSelection } from "@/contexts/map-selection";
import { useFilters } from "@/contexts/filters";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { matchesParkingFilters } from "@/lib/parkingFilters";
import { OSM_FOOTPRINTS_MIN_ZOOM } from "@/lib/constants";

const FOOTPRINT_MAX_ZOOM = 17;
const SHEET_WIDTH = 400;
const DRAWER_SNAP = 0.5;

type LatLngTuple = [number, number];

function geoJsonRingToLeaflet(ring: number[][]): LatLngTuple[] {
  return ring.map(([lng, lat]) => [lat, lng]);
}

export default function OsmFootprintsLayer() {
  const map = useMap();
  const isMobile = useIsMobile();
  const { parkings } = useParkings();
  const { selectParking } = useMapSelection();
  const { activeFilters, activeFilterCount } = useFilters();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvent("zoomend", () => setZoom(map.getZoom()));

  if (zoom < OSM_FOOTPRINTS_MIN_ZOOM || !parkings) return null;

  return (
    <>
      {parkings.features.map((feature: Feature) => {
        const p = feature.properties as ParkingFeatureProperties;
        if (!p.footprint) return null;

        const id = feature.id as string;
        const [lng, lat] = (feature.geometry as Point).coordinates;
        const footprint = p.footprint as GeoJSONPolygon | MultiPolygon;
        const matches = activeFilterCount === 0 || matchesParkingFilters(p, activeFilters);
        const color = p.source === "osm" ? "#78909c" : "#1565c0";
        const pathOptions = { color, fillColor: color, fillOpacity: matches ? 0.5 : 0.08, opacity: matches ? 1 : 0.15, weight: 1.5 };

        const handleClick = (e: L.LeafletMouseEvent) => {
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
            estimated_capacity: p.estimated_capacity ?? null,
            disabled_spaces: p.disabled_spaces,
            ev_chargers: p.ev_chargers,
            bike_spaces: p.bike_spaces,
            moto_spaces: p.moto_spaces,
            moto_ev_spaces: p.moto_ev_spaces,
            carsharing_spaces: p.carsharing_spaces,
            carpool_spaces: p.carpool_spaces,
            max_height: p.max_height ?? null,
            operator: p.operator ?? null,
            info_url: p.info_url ?? null,
            info: p.info ?? null,
            source: p.source,
            footprint,
            fare_1h: p.fare_1h ?? null,
            fare_2h: p.fare_2h ?? null,
            fare_3h: p.fare_3h ?? null,
            fare_4h: p.fare_4h ?? null,
            fare_24h: p.fare_24h ?? null,
            subscription_resident: p.subscription_resident ?? null,
            subscription_non_resident: p.subscription_non_resident ?? null,
            free_spaces: null,
          });

          const coords = footprint.type === "Polygon"
            ? footprint.coordinates[0]
            : footprint.coordinates.flatMap((poly) => poly[0]);
          const bounds = L.latLngBounds(coords.map(([fLng, fLat]) => L.latLng(fLat, fLng)));
          const { y: mapH } = map.getSize();
          const bottomRight = isMobile
            ? L.point(0, mapH * DRAWER_SNAP)
            : L.point(SHEET_WIDTH, 0);
          map.fitBounds(bounds, { paddingBottomRight: bottomRight, maxZoom: FOOTPRINT_MAX_ZOOM, animate: true });
        };

        if (footprint.type === "Polygon") {
          return (
            <Polygon
              key={id}
              positions={geoJsonRingToLeaflet(footprint.coordinates[0])}
              pathOptions={pathOptions}
              eventHandlers={{ click: handleClick }}
            />
          );
        }

        if (footprint.type === "MultiPolygon") {
          const positions = footprint.coordinates.map((poly) => geoJsonRingToLeaflet(poly[0]));
          return (
            <Polygon
              key={id}
              positions={positions}
              pathOptions={pathOptions}
              eventHandlers={{ click: handleClick }}
            />
          );
        }

        return null;
      })}
    </>
  );
}
