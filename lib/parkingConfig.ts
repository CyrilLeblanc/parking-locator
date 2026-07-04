export const FACILITY_LABELS: Record<string, string> = {
  ouvrage: "Parking en ouvrage",
  enclos_en_surface: "Enclos en surface",
  // OSM parking tag values
  surface: "Parking en surface",
  "multi-storey": "Parking à étages",
  underground: "Parking souterrain",
  rooftop: "Parking sur toit",
  street_side: "Stationnement sur rue",
};

const COVERED_FACILITY_TYPES = new Set(["ouvrage", "multi-storey", "underground"]);
const OPEN_AIR_FACILITY_TYPES = new Set([
  "enclos_en_surface",
  "surface",
  "rooftop",
  "street_side",
  "lane",
  "on_kerb",
  "half_on_kerb",
]);

export type FacilityCoverage = "covered" | "open";

/**
 * Whether a parking facility is sheltered (covered) or open-air, derived from
 * its LaMetro/OSM `facility_type`. Returns null for unknown types so the UI can
 * omit the indication rather than guess.
 *
 * Covered: built structures (ouvrage, multi-storey, underground).
 * Open-air: surface lots, rooftops and on-street parking.
 */
export function facilityCoverage(facilityType: string): FacilityCoverage | null {
  if (COVERED_FACILITY_TYPES.has(facilityType)) return "covered";
  if (OPEN_AIR_FACILITY_TYPES.has(facilityType)) return "open";
  return null;
}
