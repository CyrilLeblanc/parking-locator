import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import zoneVerteData from "../doc/zone_verte.json";

function keyToMinutes(key: string): number {
  const minMatch = key.match(/^(\d+)min$/);
  if (minMatch) return parseInt(minMatch[1]);
  const hMatch = key.match(/^(\d+)h(\d+)?$/);
  if (hMatch) return parseInt(hMatch[1]) * 60 + parseInt(hMatch[2] ?? "0");
  throw new Error(`Cannot parse duration key: ${key}`);
}

const PENALTY_MINUTES = keyToMinutes("8h30"); // 510

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  await prisma.$executeRaw`
    DELETE FROM street_parking_fare_bracket WHERE zone_color = 'vert'
  `;

  let count = 0;
  for (const [key, fareStr] of Object.entries(zoneVerteData)) {
    const duration_min = keyToMinutes(key);
    const fare = parseFloat(fareStr as string);
    const is_penalty = duration_min === PENALTY_MINUTES;

    await prisma.$executeRaw`
      INSERT INTO street_parking_fare_bracket (zone_color, duration_min, fare, is_penalty)
      VALUES ('vert', ${duration_min}, ${fare}, ${is_penalty})
    `;
    count++;
  }

  console.log(`Done. ${count} brackets importés pour zone verte.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
