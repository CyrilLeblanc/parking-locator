import type { ZoneFareBracket } from "@/types/zone";

function roundToTen(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Voirie : interpolation linéaire entre les deux brackets encadrants, arrondi 0.10€.
 * Retourne null si la durée dépasse le dernier bracket non-penalty.
 */
export function estimateZoneFare(
  brackets: ZoneFareBracket[],
  durationMin: number
): number | null {
  const nonPenalty = brackets
    .filter((b) => !b.is_penalty)
    .sort((a, b) => a.duration_min - b.duration_min);

  if (nonPenalty.length === 0) return null;

  const max = nonPenalty[nonPenalty.length - 1];
  if (durationMin > max.duration_min) return null;

  const min = nonPenalty[0];
  if (durationMin <= min.duration_min) return roundToTen(min.fare);

  const exact = nonPenalty.find((b) => b.duration_min === durationMin);
  if (exact) return roundToTen(exact.fare);

  const lower = [...nonPenalty].reverse().find((b) => b.duration_min < durationMin)!;
  const upper = nonPenalty.find((b) => b.duration_min > durationMin)!;

  const ratio = (durationMin - lower.duration_min) / (upper.duration_min - lower.duration_min);
  return roundToTen(lower.fare + ratio * (upper.fare - lower.fare));
}

/**
 * Parking en ouvrage : bracket supérieur ou égal (pas d'interpolation).
 * Retourne null si aucun bracket disponible ou si la durée dépasse tous les brackets.
 */
export function estimateParkingFare(
  fare: {
    fare_1h?: number | null;
    fare_2h?: number | null;
    fare_3h?: number | null;
    fare_4h?: number | null;
    fare_24h?: number | null;
  },
  durationMin: number
): number | null {
  const brackets = [
    { duration_min: 60, fare: fare.fare_1h },
    { duration_min: 120, fare: fare.fare_2h },
    { duration_min: 180, fare: fare.fare_3h },
    { duration_min: 240, fare: fare.fare_4h },
    { duration_min: 1440, fare: fare.fare_24h },
  ].filter((b): b is { duration_min: number; fare: number } => b.fare != null);

  if (brackets.length === 0) return null;

  const ceiling = brackets.find((b) => b.duration_min >= durationMin);
  return ceiling ? ceiling.fare : null;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatFareValue(value: number): string {
  if (value === 0) return "Gratuit";
  return `${value.toFixed(2).replace(".", ",")} €`.replace(",00 €", " €");
}
