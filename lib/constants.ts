import { getISODay } from "date-fns";

export const MAP_CENTER: [number, number] = [45.1885, 5.7245];
export const MAP_ZOOM = 15;
export const MAP_TILE_URL = "https://data.mobilites-m.fr/carte-dark/{z}/{x}/{y}.png";

/** A data source rendered on the map, surfaced in the attribution panel ("i" button). */
export interface MapDataSource {
  id: string;
  label: string;
  provider: string;
  license: string;
}

/**
 * Map data sources and their licenses, shown in the discrete "i" attribution panel.
 * OSM's ODbL requires attribution to remain accessible — satisfied by this panel.
 */
export const MAP_DATA_SOURCES: readonly MapDataSource[] = [
  {
    id: "tiles",
    label: "Fond de carte",
    provider: "MobiS — data.mobilites-m.fr",
    license: "Données ouvertes (Métropole de Grenoble)",
  },
  {
    id: "parkings-metro",
    label: "Parkings relais & souterrains",
    provider: "La Métropole — Open Data",
    license: "Licence Ouverte",
  },
  {
    id: "parkings-osm",
    label: "Parkings OpenStreetMap",
    provider: "Contributeurs OpenStreetMap",
    license: "Open Database License (ODbL)",
  },
  {
    id: "leaflet",
    label: "Moteur de carte",
    provider: "Leaflet",
    license: "BSD-2-Clause",
  },
];

/** Zoom à partir duquel les emprises OSM sont affichées et les markers OSM masqués. */
export const OSM_FOOTPRINTS_MIN_ZOOM = 14;

export const HISTORY_SLOT_COUNT = 48; // 48 × 30 min = 24h

export const COLLECT_SKIP_THRESHOLD_S = 4 * 60;

/** Returns today's day index using the Mon=0 … Sun=6 convention (ISO 8601). */
export function todayDayOfWeek(): number {
  return getISODay(new Date()) - 1;
}
