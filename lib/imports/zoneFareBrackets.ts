import { prisma } from "../prisma";

// Tarifs zone verte Grenoble — source : arrêté municipal
const ZONE_VERTE_BRACKETS: Record<string, string> = {
  "15min": "0.50",
  "30min": "1.00",
  "1h":    "2.00",
  "2h":    "4.00",
  "3h":    "5.50",
  "4h":    "6.50",
  "5h":    "7.50",
  "6h":    "8.50",
  "7h":    "9.50",
  "8h":    "10.50",
  "8h30":  "35.00",
};

function keyToMinutes(key: string): number {
  const minMatch = key.match(/^(\d+)min$/);
  if (minMatch) return parseInt(minMatch[1]);
  const hMatch = key.match(/^(\d+)h(\d+)?$/);
  if (hMatch) return parseInt(hMatch[1]) * 60 + parseInt(hMatch[2] ?? "0");
  throw new Error(`Cannot parse duration key: ${key}`);
}

const PENALTY_MINUTES = keyToMinutes("8h30");

export async function importZoneFareBrackets(): Promise<void> {
  await prisma.$executeRaw`DELETE FROM street_parking_fare_bracket WHERE zone_color = 'vert'`;

  let count = 0;
  for (const [key, fareStr] of Object.entries(ZONE_VERTE_BRACKETS)) {
    const duration_min = keyToMinutes(key);
    const fare = parseFloat(fareStr);
    const is_penalty = duration_min === PENALTY_MINUTES;

    await prisma.$executeRaw`
      INSERT INTO street_parking_fare_bracket (zone_color, duration_min, fare, is_penalty)
      VALUES ('vert', ${duration_min}, ${fare}, ${is_penalty})
    `;
    count++;
  }

  console.log(`Done. ${count} brackets importés pour zone verte.`);
}
