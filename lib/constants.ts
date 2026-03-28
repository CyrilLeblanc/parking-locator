import { getISODay } from "date-fns";

export const MAP_CENTER: [number, number] = [45.1885, 5.7245];
export const MAP_ZOOM = 15;
export const MAP_TILE_URL = "https://data.mobilites-m.fr/carte-dark/{z}/{x}/{y}.png";

/** Zoom à partir duquel les emprises OSM sont affichées et les markers OSM masqués. */
export const OSM_FOOTPRINTS_MIN_ZOOM = 14;

export const HISTORY_SLOT_COUNT = 48; // 48 × 30 min = 24h

export const COLLECT_SKIP_THRESHOLD_S = 4 * 60;

/** Returns today's day index using the Mon=0 … Sun=6 convention (ISO 8601). */
export function todayDayOfWeek(): number {
  return getISODay(new Date()) - 1;
}
