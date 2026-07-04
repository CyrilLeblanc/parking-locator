import type { ActiveFilters } from "@/contexts/filters";
import type { ParkingFeatureProperties } from "@/types/parking";

export function matchesParkingFilters(
  p: ParkingFeatureProperties,
  f: ActiveFilters
): boolean {
  if (f.pmr && !(p.disabled_spaces > 0)) return false;
  if (f.ev && !(p.ev_chargers > 0)) return false;
  if (f.maxHeight === "suv" && !(p.max_height != null && p.max_height >= 1.9)) return false;
  if (f.maxHeight === "utility" && !(p.max_height != null && p.max_height >= 2.5)) return false;
  if (f.freeOnly && !p.free) return false;
  return true;
}

// Les zones de stationnement sont toujours payantes (elles n'ont pas d'attributs PMR/EV/etc.)
// → tout filtre actif les exclut.
export function zoneMatchesFilters(f: ActiveFilters): boolean {
  return !f.pmr && !f.ev && !f.maxHeight && !f.freeOnly;
}
