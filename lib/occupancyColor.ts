/**
 * Occupancy color ramp used by the parking drawer's occupancy bar.
 *
 * Interpolates across the same palette as the map pins
 * (see {@link file://./../components/parking/ParkingsLayer.tsx getParkingIcon}):
 * green when empty → orange around half → red when full. The color therefore
 * reflects how full the parking is, not merely whether it is full.
 *
 * Pure and deterministic so it is straightforward to unit-test.
 *
 * @param pct occupancy ratio in [0, 100] — fraction of the capacity in use.
 * @returns a CSS `rgb()` color.
 */
type RGB = readonly [number, number, number];

const OCCUPANCY_STOPS: readonly { at: number; rgb: RGB }[] = [
  { at: 0, rgb: [76, 175, 80] }, // #4caf50 — green (empty)
  { at: 50, rgb: [255, 152, 0] }, // #ff9800 — orange (mid)
  { at: 100, rgb: [244, 67, 54] }, // #f44336 — red (full)
];

export function occupancyColor(pct: number): string {
  const value = Math.max(0, Math.min(100, pct));

  for (let i = 1; i < OCCUPANCY_STOPS.length; i++) {
    const prev = OCCUPANCY_STOPS[i - 1];
    const curr = OCCUPANCY_STOPS[i];
    if (value <= curr.at) {
      const span = curr.at - prev.at;
      const local = span === 0 ? 0 : (value - prev.at) / span;
      const mix = (from: number, to: number) => Math.round(from + (to - from) * local);
      return `rgb(${mix(prev.rgb[0], curr.rgb[0])}, ${mix(prev.rgb[1], curr.rgb[1])}, ${mix(prev.rgb[2], curr.rgb[2])})`;
    }
  }

  const last = OCCUPANCY_STOPS[OCCUPANCY_STOPS.length - 1];
  return `rgb(${last.rgb[0]}, ${last.rgb[1]}, ${last.rgb[2]})`;
}
